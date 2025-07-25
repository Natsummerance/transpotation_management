
import cv2
import numpy as np
import os
import shutil
import threading
import tkinter as tk
import tkinter.simpledialog
from PIL import Image, ImageTk
import sys
import argparse
import base64
import json
import time

# 首先读取config文件，第一行代表当前已经储存的人名个数，接下来每一行是（id，name）标签和对应的人名
id_dict = {}  # 字典里存的是id——name键值对
Total_face_num = 999  # 已经被识别有用户名的人脸个数,


def init():
    global Total_face_num
    global id_dict
    id_dict = {}
    if not os.path.exists('config.txt'):
        Total_face_num = 0
        with open('config.txt', 'w', encoding='utf-8') as f:
            f.write('Total_face_num = 0\n')
        return

    with open('config.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        if not lines:
            Total_face_num = 0
            with open('config.txt', 'w', encoding='utf-8') as fw:
                fw.write('Total_face_num = 0\n')
            return

    # Find Total_face_num first
    num_line_found = False
    for line in lines:
        if 'Total_face_num' in line:
            try:
                Total_face_num = int(line.split('=')[-1].strip())
                num_line_found = True
            except (ValueError, IndexError):
                pass # Will be handled later
    
    # Populate id_dict and find max_id if num_line not found
    max_id = -1
    for line in lines:
        line = line.strip()
        if not line or 'Total_face_num' in line:
            continue
        try:
            if ':' in line:
                id_str, name = line.split(':', 1)
            elif ' ' in line:
                id_str, name = line.split(' ', 1)
            else:
                continue
            
            id_val = int(id_str.strip())
            id_dict[id_val] = name.strip()
            if id_val > max_id:
                max_id = id_val
        except ValueError:
            print(f"Skipping malformed line: {line}")

    if not num_line_found:
        Total_face_num = max_id + 1


init()

# 获取当前脚本所在目录
script_dir = os.path.dirname(os.path.abspath(__file__))

# 加载OpenCV人脸检测分类器Haar - 使用OpenCV内置文件
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
# 添加眼睛和微笑检测器
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')

# 检查分类器是否成功加载
if face_cascade.empty():
    print("错误：无法加载人脸检测分类器")
    exit(1)
if eye_cascade.empty():
    print("错误：无法加载眼睛检测分类器")
    exit(1)
if smile_cascade.empty():
    print("错误：无法加载微笑检测分类器")
    exit(1)

print("所有分类器加载成功")

# 准备好识别方法LBPH方法
recognizer = cv2.face.LBPHFaceRecognizer_create()

# 打开标号为0的摄像头
camera = cv2.VideoCapture(0)  # 摄像头
success, img = camera.read()  # 从摄像头读取照片
W_size = 0.1 * camera.get(3)
H_size = 0.1 * camera.get(4)

system_state_lock = 0  # 标志系统状态的量 0表示无子线程在运行 1表示正在刷脸 2表示正在录入新面孔。
# 相当于mutex锁，用于线程同步


'''
============================================================================================
以上是初始化
============================================================================================
'''


def detect_blink_and_smile(gray_face):
    """检测眨眼和微笑"""
    eyes = eye_cascade.detectMultiScale(gray_face, 1.1, 5)
    smiles = smile_cascade.detectMultiScale(gray_face, 1.8, 20)
    
    # 眨眼检测：眼睛数量变化
    eye_count = len(eyes)
    has_smile = len(smiles) > 0
    
    return eye_count, has_smile


def check_face_exists(face_gray):
    """检测当前人脸是否已经录入过"""
    trainer_dir = 'face-recognition-cv2-master/traindata'
    if not os.path.exists(trainer_dir) or not os.listdir(trainer_dir):
        return False, "没有训练数据"

    models = {}
    for file_name in os.listdir(trainer_dir):
        if file_name.endswith("_train.yml"):
            try:
                user_id = int(file_name.split('_')[0])
                recog = cv2.face.LBPHFaceRecognizer_create()
                recog.read(os.path.join(trainer_dir, file_name))
                models[user_id] = recog
            except:
                continue
    
    if not models:
        return False, "没有找到有效的模型文件"

    best_match_id = -1
    lowest_confidence = 100

    for user_id, model in models.items():
        try:
            idnum, confidence = model.predict(face_gray)
            if confidence < lowest_confidence:
                lowest_confidence = confidence
                best_match_id = user_id
        except:
            continue

    if lowest_confidence < 50:  # 置信度阈值
        user_name = id_dict.get(best_match_id, f"用户{best_match_id}")
        return True, f"人脸已存在: {user_name}"
    
    return False, "新人脸"


def Get_new_face_with_expression():
    print("正在从摄像头录入新人脸信息，请配合做出表情验证 \n")
    print("将在录入进度50%时进行眨眼验证")
    print("同时会检测人脸是否已经录入过")

    # 存在目录data就清空，不存在就创建，确保最后存在空的data目录
    filepath = "data"
    if not os.path.exists(filepath):
        os.mkdir(filepath)
    else:
        shutil.rmtree(filepath)
        os.mkdir(filepath)

    sample_num = 0  # 已经获得的样本数
    pictur_num = 300  # 表示摄像头拍摄取样的数量
    
    # 验证检查点
    checkpoint_50 = int(pictur_num * 0.50)  # 50%检查点
    
    # 验证状态
    blink_verified = False
    face_duplicate_checked = False
    
    # 当前验证阶段
    verification_mode = False  # 是否处于验证模式
    verification_counter = 0
    
    while True:  # 从摄像头读取图片
        global success
        global img  # 因为要显示在可视化的控件内，所以要用全局的
        success, img = camera.read()

        # 转为灰度图片
        if success is True:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            break

        # 检测人脸
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        # 检查是否到达验证检查点
        if not verification_mode:
            if sample_num >= checkpoint_50 and not blink_verified:
                verification_mode = True
                verification_counter = 0
                print("\n到达50%检查点，开始眨眼验证")
                var.set("50%检查点 - 请眨眼")
                window.update()

        # 框选人脸，for循环保证一个能检测的实时动态视频流
        for (x, y, w, h) in faces:
            face_gray = gray[y:y + h, x:x + w]
            eye_count, has_smile = detect_blink_and_smile(face_gray)
            
            # 检测张嘴（使用微笑检测器的变体）
            mouth_regions = smile_cascade.detectMultiScale(face_gray, 1.5, 10)
            has_mouth_open = len(mouth_regions) > 0
            
            # 检测人脸是否已经录入过（只在开始时检测一次）
            if not face_duplicate_checked and sample_num < 10:
                is_duplicate, message = check_face_exists(face_gray)
                if is_duplicate:
                    print(f"\n检测到重复人脸: {message}")
                    var.set(f"检测到重复人脸: {message}")
                    window.update()
                    return False
                face_duplicate_checked = True
                print("人脸检测通过，开始录入")
            
            if verification_mode:
                # 验证模式 - 不录入样本，只进行眨眼验证
                cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 255), 2)  # 青色：等待眨眼
                cv2.putText(img, "Checkpoint 50% - Blink", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
                if eye_count < 2:  # 检测到眨眼
                    verification_counter += 1
                    if verification_counter > 5:
                        blink_verified = True
                        print("50%检查点眨眼验证完成，继续录入")
                        var.set("50%检查点眨眼验证完成，继续录入")
                        verification_mode = False
                        verification_counter = 0
                        window.update()
            else:
                # 正常录入模式
                cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)  # 绿色：正在录入
                cv2.putText(img, "Recording...", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # 样本数加1
                sample_num += 1
                # 保存图像
                cv2.imwrite("./data/User." + str(Total_face_num) + '.' + str(sample_num) + '.jpg', gray[y:y + h, x:x + w])

        cv2.waitKey(1)
        
        # 检查是否完成录入
        if sample_num >= pictur_num:
            # 检查是否完成了眨眼验证
            if not blink_verified:
                print("\n录入完成但眨眼验证未通过，需要重新录入")
                var.set("眨眼验证未通过，需要重新录入")
                window.update()
                return False
            break
        elif not verification_mode:
            # 显示录入进度
            progress_percent = sample_num / pictur_num * 100
            l = int(sample_num / pictur_num * 50)
            r = int((pictur_num - sample_num) / pictur_num * 50)
            print("\r" + "%{:.1f}".format(progress_percent) + "=" * l + "->" + "_" * r, end="")
            var.set("%{:.1f}".format(progress_percent))  # 控件可视化进度信息
            window.update()  # 刷新控件以实时显示进度
        else:
            # 验证模式下显示验证进度
            var.set("50%检查点 - 眨眼验证中...")
            window.update()

    print("\n录入完成，所有验证通过")
    return True


def Get_new_face():
    print("正在从摄像头录入新人脸信息 \n")

    # 存在目录data就清空，不存在就创建，确保最后存在空的data目录
    filepath = "data"
    if not os.path.exists(filepath):
        os.mkdir(filepath)
    else:
        shutil.rmtree(filepath)
        os.mkdir(filepath)

    sample_num = 0  # 已经获得的样本数

    while True:  # 从摄像头读取图片

        global success
        global img  # 因为要显示在可视化的控件内，所以要用全局的
        success, img = camera.read()

        # 转为灰度图片
        if success is True:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            break

        # 检测人脸，将每一帧摄像头记录的数据带入OpenCv中，让Classifier判断人脸
        # 其中gray为要检测的灰度图像，1.3为每次图像尺寸减小的比例，5为minNeighbors
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        # 框选人脸，for循环保证一个能检测的实时动态视频流
        for (x, y, w, h) in faces:
            # xy为左上角的坐标,w为宽，h为高，用rectangle为人脸标记画框
            cv2.rectangle(img, (x, y), (x + w, y + w), (255, 0, 0))
            # 样本数加1
            sample_num += 1
            # 保存图像，把灰度图片看成二维数组来检测人脸区域，这里是保存在data缓冲文件夹内
            cv2.imwrite("./data/User." + str(Total_face_num) + '.' + str(sample_num) + '.jpg', gray[y:y + h, x:x + w])

        pictur_num = 300 # 表示摄像头拍摄取样的数量,越多效果越好，但获取以及训练的越慢

        cv2.waitKey(1)
        if sample_num > pictur_num:
            break
        else:  # 控制台内输出进度条
            l = int(sample_num / pictur_num * 50)
            r = int((pictur_num - sample_num) / pictur_num * 50)
            print("\r" + "%{:.1f}".format(sample_num / pictur_num * 100) + "=" * l + "->" + "_" * r, end="")
            var.set("%{:.1f}".format(sample_num / pictur_num * 100))  # 控件可视化进度信息
            # tk.Tk().update()
            window.update()  # 刷新控件以实时显示进度


def Train_new_face():
    # 读取Facedata文件夹下的人脸数据
    faces, ids = get_images_and_labels('face-recognition-cv2-master/Facedata', Total_face_num)
    if len(faces) == 0:
        print("没有检测到人脸，请重新采集")
        return
    # 训练模型
    recognizer.train(faces, np.array(ids))
    # 保存模型到识别器文件夹
    trainer_dir = 'face-recognition-cv2-master/traindata'
    if not os.path.exists(trainer_dir):
        os.mkdir(trainer_dir)
    recognizer.save(os.path.join(trainer_dir, f'{Total_face_num}_train.yml'))
    print('{} 张人脸被训练'.format(len(np.unique(ids))))


# 创建一个函数，用于从数据集文件夹中获取训练图片,并获取id
# 注意图片的命名格式为User.id.sampleNum
def get_images_and_labels(path, user_id):
    # 储存人脸的列表
    face_samples = []
    # 储存id的列表
    ids = []
    # 储存图片信息
    image_paths = [os.path.join(path, f) for f in os.listdir(path) if f.split('.')[1] == str(user_id)]
    # face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

    if not os.path.exists('face-recognition-cv2-master/Facedata'):
        os.mkdir('face-recognition-cv2-master/Facedata')

    # 遍历图片路径，导入图片和id，添加到列表
    for image_path in image_paths:
        try:
            # 导入图片，转为灰度
            pil_image = Image.open(image_path).convert('L')
            # 将图片转化为数组
            img_numpy = np.array(pil_image, 'uint8')
            # 获取图片id
            id = int(os.path.split(image_path)[-1].split(".")[1])
            # 检测人脸
            faces = face_cascade.detectMultiScale(img_numpy)
            # 将人脸区域和id添加到列表
            for (x, y, w, h) in faces:
                face_samples.append(img_numpy[y:y + h, x:x + w])
                ids.append(id)
        except Exception as e:
            print(f"处理图片 {image_path} 时出错: {e}")

    return face_samples, ids


def write_config(user_name):
    # Read all users, then rewrite the file
    # This is safer than trying to append/modify in place
    id_dict[Total_face_num] = user_name
    with open('config.txt', 'w', encoding='utf-8') as f:
        for user_id, name in id_dict.items():
            f.write(f"{user_id}:{name}\n")
        f.write(f'Total_face_num = {Total_face_num + 1}\n')
    init()

def write_config_rename(id_to_rename, new_name):
    with open('config.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    with open('config.txt', 'w', encoding='utf-8') as f:
        for i, line in enumerate(lines):
            if i == 0:
                f.write(line)
                continue
            parts = line.strip().split(' ', 1)
            if len(parts) == 2 and int(parts[0]) == id_to_rename:
                f.write(f"{id_to_rename} {new_name}\n")
                id_dict[id_to_rename] = new_name
            else:
                f.write(line)


'''
============================================================================================
以上是录入新人脸信息功能的实现
============================================================================================
'''


def scan_face():
    trainer_dir = 'face-recognition-cv2-master/traindata'
    if not os.path.exists(trainer_dir) or not os.listdir(trainer_dir):
        return 0, "没有训练数据，请先录入人脸"

    models = {}
    for file_name in os.listdir(trainer_dir):
        if file_name.endswith("_train.yml"):
            try:
                user_id = int(file_name.split('_')[0])
                recog = cv2.face.LBPHFaceRecognizer_create()
                recog.read(os.path.join(trainer_dir, file_name))
                models[user_id] = recog
            except:
                print(f"加载模型 {file_name} 失败")
                continue
    
    if not models:
        return 0, "没有找到有效的模型文件"

    recognized_faces = {}

    for _ in range(30): # Scan for a short period
        global success, img
        while system_state_lock == 2:
            print("\r刷脸被录入面容阻塞", end="")
            pass

        success, img = camera.read()
        if not success:
            continue

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.2, minNeighbors=5,
            minSize=(int(W_size), int(H_size))
        )

        for (x, y, w, h) in faces:
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            best_match_id = -1
            lowest_confidence = 100 # Lower is better for LBPH

            for user_id, model in models.items():
                idnum, confidence = model.predict(gray[y:y + h, x:x + w])
                if confidence < lowest_confidence:
                    lowest_confidence = confidence
                    best_match_id = user_id

            user_name = "unknown"
            if lowest_confidence < 50: # Confidence threshold
                confidence_text = "{0}%".format(round(100 - lowest_confidence))
                if best_match_id in id_dict:
                    user_name = id_dict[best_match_id]
                    recognized_faces.setdefault(best_match_id, 0)
                    recognized_faces[best_match_id] += 1
                else:
                    user_name = "Untagged user:" + str(best_match_id)
            else:
                confidence_text = str(best_match_id)

            font = cv2.FONT_HERSHEY_SIMPLEX
            cv2.putText(img, str(user_name), (x + 5, y - 5), font, 1, (0, 0, 255), 1)
            cv2.putText(img, str(confidence_text), (x + 5, y + h - 5), font, 1, (0, 0, 0), 1)
        cv2.waitKey(1)

    if not recognized_faces:
        return 0, "无法识别"

    most_recognized_id = max(recognized_faces, key=recognized_faces.get)
    if recognized_faces[most_recognized_id] > 5: # Threshold for number of successful recognitions
        return most_recognized_id, id_dict[most_recognized_id]
    else:
        return 0, "无法识别"


'''
============================================================================================
以上是关于刷脸功能的设计
============================================================================================
'''


def f_scan_face_thread():
    var.set('刷脸中...')
    window.update()
    ans_id, ans_name = scan_face()
    if ans_id == 0:
        result_text = "最终结果：" + ans_name
    else:
        result_text = "识别成功：" + ans_name
    
    print(result_text)
    var.set(result_text)

    global system_state_lock
    print("锁被释放0")
    system_state_lock = 0


def f_scan_face():
    global system_state_lock
    print("\n当前锁的值为：" + str(system_state_lock))
    if system_state_lock == 1:
        print("阻塞，因为正在刷脸")
        return 0
    elif system_state_lock == 2:  # 如果正在录入新面孔就阻塞
        print("\n刷脸被录入面容阻塞\n"
              "")
        return 0
    system_state_lock = 1
    p = threading.Thread(target=f_scan_face_thread)
    p.setDaemon(True)  # 把线程P设置为守护线程 若主线程退出 P也跟着退出
    p.start()


def f_rec_face_thread(user_name):
    global system_state_lock, Total_face_num
    var.set('录入')
    cv2.destroyAllWindows()
    
    # 使用新的表情验证录入函数
    if not Get_new_face_with_expression():  # 采集新人脸
        var.set("录入失败：表情验证未通过")
        system_state_lock = 0
        return

    datapath = 'data'
    facepath = 'face-recognition-cv2-master/Facedata'
    if not os.path.exists(facepath):
        os.mkdir(facepath)
    for f in os.listdir(datapath):
        shutil.move(os.path.join(datapath, f), os.path.join(facepath, f))

    print("采集完毕，开始训练")
    
    Train_new_face()
    write_config(user_name)
    Total_face_num += 1
    
    print("锁被释放0")
    system_state_lock = 0


def f_rec_face():
    global system_state_lock
    print("当前锁的值为：" + str(system_state_lock))
    if system_state_lock == 2:
        print("阻塞，因为正在录入面容")
        return 0
    else:
        user_name = tkinter.simpledialog.askstring(title='录入人脸', prompt='请输入您的名称：')
        if user_name:
            system_state_lock = 2  # 修改system_state_lock
            print("改为2", end="")
            print("当前锁的值为：" + str(system_state_lock))

            p = threading.Thread(target=f_rec_face_thread, args=(user_name,))
            p.setDaemon(True)  # 把线程P设置为守护线程 若主线程退出 P也跟着退出
            p.start()


def f_exit():  # 退出按钮
    exit()


'''
============================================================================================
以上是关于多线程的设计
============================================================================================
'''

window = tk.Tk()
window.title('人脸识别')   # 窗口标题
window.geometry('1000x500')  # 这里的乘是小x

# 在图形界面上设定标签，类似于一个提示窗口的作用
var = tk.StringVar()
l = tk.Label(window, textvariable=var, bg='green', fg='white', font=('Arial', 12), width=50, height=4)
# 说明： bg为背景，fg为字体颜色，font为字体，width为长，height为高，这里的长和高是字符的长和高，比如height=2,就是标签有2个字符这么高
l.pack()  # 放置l控件
var.set('人脸识别 ')

# 在窗口界面设置放置Button按键并绑定处理函数
button_a = tk.Button(window, text='开始刷脸', font=('Arial', 12), width=10, height=2, command=f_scan_face)
button_a.place(x=800, y=120)

button_b = tk.Button(window, text='录入人脸', font=('Arial', 12), width=10, height=2, command=f_rec_face)
button_b.place(x=800, y=220)

def f_rename_face():
    if not id_dict:
        var.set("当前没有人脸数据，无法修改")
        window.update()
        return

    id_to_rename = tkinter.simpledialog.askinteger("修改名称", "请输入要修改名称的人脸ID:", minvalue=1, maxvalue=Total_face_num)
    if id_to_rename and id_to_rename in id_dict:
        new_name = tkinter.simpledialog.askstring("修改名称", f"请输入ID {id_to_rename} 的名称:")
        if new_name:
            write_config_rename(id_to_rename, new_name)
            var.set(f"ID {id_to_rename} 的名称已修改为 {new_name}")
        else:
            var.set("操作取消")
    else:
        var.set("无效的ID或操作取消")
    window.update()

button_c = tk.Button(window, text='退出', font=('Arial', 12), width=10, height=2, command=f_exit)
button_c.place(x=800, y=420)

button_d = tk.Button(window, text='修改名称', font=('Arial', 12), width=10, height=2, command=f_rename_face)
button_d.place(x=800, y=320)

panel = tk.Label(window, width=500, height=350)  # 摄像头模块大小
panel.place(x=10, y=100)  # 摄像头模块的位置
window.config(cursor="arrow")


def video_loop():  # 用于在label内动态展示摄像头内容（摄像头嵌入控件）
    global success
    global img
    if success:
        cv2.waitKey(1)
        cv2image = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA)  # 转换颜色从BGR到RGBA
        current_image = Image.fromarray(cv2image)  # 将图像转换成Image对象
        imgtk = ImageTk.PhotoImage(image=current_image)
        panel.imgtk = imgtk
        panel.config(image=imgtk)
        window.after(1, video_loop)


video_loop()

#  窗口循环，用于显示
window.mainloop()

'''
============================================================================================
以上是关于界面的设计
============================================================================================
'''

def decode_base64_image(base64_str):
    img_bytes = base64.b64decode(base64_str)
    img_array = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1].startswith('--action'):
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument('--action', choices=['register', 'recognize', 'check_blink', 'check_duplicate'], required=True)
        parser.add_argument('--image_base64', required=False)
        parser.add_argument('--username', required=False)
        args = parser.parse_args()

        # 初始化
        init()
        
        if args.action == 'check_blink':
            # 眨眼检测
            img = decode_base64_image(args.image_base64)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            eyes = eye_cascade.detectMultiScale(gray, 1.1, 5)
            blink = len(eyes) < 2
            print(json.dumps({"blink": blink}))
            sys.exit(0)
        elif args.action == 'check_duplicate':
            img = decode_base64_image(args.image_base64)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            is_duplicate, message = check_face_exists(gray)
            print(json.dumps({"duplicate": is_duplicate, "message": message}))
            sys.exit(0)
        elif args.action == 'register' and not args.image_base64:
            # 批量注册，读取 Facedata/ 下图片并训练
            user_id = 0
            if os.path.exists('config.txt'):
                with open('config.txt', 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for line in lines:
                        if 'Total_face_num' in line:
                            try:
                                user_id = int(line.split('=')[-1].strip())
                            except:
                                user_id = 0
            # 训练模型
            faces, ids = get_images_and_labels('face-recognition-cv2-master/Facedata', user_id)
            if len(faces) == 0:
                print(json.dumps({"code": 0, "msg": "没有检测到有效的人脸数据"}))
                sys.exit(0)
            recognizer = cv2.face.LBPHFaceRecognizer_create()
            recognizer.train(faces, np.array(ids))
            if not os.path.exists('face-recognition-cv2-master/traindata'):
                os.mkdir('face-recognition-cv2-master/traindata')
            recognizer.save(f'face-recognition-cv2-master/traindata/{user_id}_train.yml')
            # 更新 config.txt
            with open('config.txt', 'a', encoding='utf-8') as f:
                f.write(f"{user_id}:{args.username}\n")
                f.write(f"Total_face_num = {user_id + 1}\n")
            print(json.dumps({"code": 1, "msg": "注册成功", "user_id": user_id, "username": args.username}))
            sys.exit(0)
        elif args.action == 'register':
            # 保存图片到 Facedata
            if not os.path.exists('face-recognition-cv2-master/Facedata'):
                os.mkdir('face-recognition-cv2-master/Facedata')
            user_id = 0
            if os.path.exists('config.txt'):
                with open('config.txt', 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for line in lines:
                        if 'Total_face_num' in line:
                            try:
                                user_id = int(line.split('=')[-1].strip())
                            except:
                                user_id = 0
            sample_num = 1
            for (x, y, w, h) in faces:
                face_img = gray[y:y + h, x:x + w]
                filename = f'face-recognition-cv2-master/Facedata/User.{user_id}.{sample_num}.jpg'
                cv2.imwrite(filename, face_img)
                sample_num += 1
            # 训练模型
            # 这里只训练一张，实际可扩展为多张
            recognizer = cv2.face.LBPHFaceRecognizer_create()
            recognizer.train([face_img], np.array([user_id]))
            if not os.path.exists('face-recognition-cv2-master/traindata'):
                os.mkdir('face-recognition-cv2-master/traindata')
            recognizer.save(f'face-recognition-cv2-master/traindata/{user_id}_train.yml')
            # 更新 config.txt
            with open('config.txt', 'a', encoding='utf-8') as f:
                f.write(f"{user_id}:{args.username}\n")
                f.write(f"Total_face_num = {user_id + 1}\n")
            print(json.dumps({"code": 1, "msg": "注册成功", "user_id": user_id, "username": args.username}))
            sys.exit(0)
        elif args.action == 'recognize':
            # 识别逻辑
            if not args.image_base64:
                print(json.dumps({"code": 0, "msg": "缺少图片数据"}))
                sys.exit(0)
            
            # 解码图片并检测人脸
            img = decode_base64_image(args.image_base64)
            if img is None:
                print(json.dumps({"code": 0, "msg": "图片解码失败"}))
                sys.exit(0)
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 5)
            
            if len(faces) == 0:
                print(json.dumps({"code": 0, "msg": "未检测到人脸"}))
                sys.exit(0)
            
            trainer_dir = 'face-recognition-cv2-master/traindata'
            if not os.path.exists(trainer_dir) or not os.listdir(trainer_dir):
                print(json.dumps({"code": 0, "msg": "没有训练数据"}))
                sys.exit(0)
            
            models = {}
            for file_name in os.listdir(trainer_dir):
                if file_name.endswith("_train.yml"):
                    try:
                        user_id = int(file_name.split('_')[0])
                        recog = cv2.face.LBPHFaceRecognizer_create()
                        recog.read(os.path.join(trainer_dir, file_name))
                        models[user_id] = recog
                    except:
                        continue
            
            if not models:
                print(json.dumps({"code": 0, "msg": "没有可用的识别模型"}))
                sys.exit(0)
            
            best_match_id = -1
            lowest_confidence = 100
            
            for user_id, model in models.items():
                for (x, y, w, h) in faces:
                    try:
                        idnum, confidence = model.predict(gray[y:y + h, x:x + w])
                        if confidence < lowest_confidence:
                            lowest_confidence = confidence
                            best_match_id = user_id
                    except:
                        continue
            
            if lowest_confidence < 50 and best_match_id != -1:
                # 查找用户名
                username = "未知用户"
                if os.path.exists('config.txt'):
                    with open('config.txt', 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for line in lines:
                            if line.startswith(str(best_match_id)) and ':' in line:
                                username = line.split(':', 1)[1].strip()
                                break
                
                # 构造返回数据，模拟登录成功
                user_data = {
                    "id": best_match_id,
                    "uname": username,
                    "token": f"face_token_{best_match_id}_{int(time.time())}"
                }
                print(json.dumps({"code": 1, "msg": "识别成功", "data": user_data}))
            else:
                print(json.dumps({"code": 0, "msg": "无法识别"}))
            sys.exit(0)
    else:
        # GUI模式
        init()
        # ... existing GUI code ...

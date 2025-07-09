package com.example.demo1.controller;

import com.example.demo1.domain.User;
//import com.example.demo1.dto.FaceRecognitionRequest;
import com.example.demo1.service.UserService;
import com.example.demo1.utils.Result;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;

import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/user")
public class UserController {
    @Resource
    private UserService userService;

    @PostMapping("/login")
    public Result<User> loginController(@RequestParam String uname, @RequestParam String password) {
        User user = userService.loginService(uname, password);
        if (user != null) {
            return Result.success("1", user, "登录成功！");
        } else {
            return Result.error("123", "账号或密码错误！");
        }
    }

    @PostMapping("/register")
    public Result<User> registController(@RequestBody User newUser) {
        try {
            System.out.println("接收到注册请求: " + newUser.getUname());
            User user = userService.registService(newUser);
            if (user != null) {
                return Result.success("1", user, "注册成功！");
            } else {
                return Result.error("456", "用户名已存在！");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("500", "注册失败: " + e.getMessage());
        }
    }

    @PostMapping("/login/face")
    public Result<User> faceRecognitionController(@RequestBody Map<String, String> request) {
        String imageBase64 = request.get("image");
        if (imageBase64 == null || imageBase64.isEmpty()) {
            return Result.error("400", "图片数据不能为空");
        }

        User user = userService.faceRecognitionService(imageBase64);
        if (user != null) {
            return Result.success("1", user, "人脸识别成功！");
        } else {
            return Result.error("445", "人脸识别失败，未找到匹配用户");
        }
    }

}

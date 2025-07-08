package com.example.demo1.service.servicelmpl;

import com.example.demo1.domain.User;
import com.example.demo1.repository.UserDao;
import com.example.demo1.service.UserService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.Resource;

@Service
public class UserServiceImpl implements UserService {
    @Resource
    private UserDao userDao;

    // 注入 RestTemplate
    @Resource
    private RestTemplate restTemplate;

    @Override
    public User loginService(String uname, String password) {
        User user = userDao.findByUnameAndPassword(uname, password);
        if (user != null) {
            user.setPassword("");
        }
        return user;
    }

    @Override
    public User registService(User user) {
        if (userDao.findByUname(user.getUname()) != null) {
            return null;
        } else {
            User newUser = userDao.save(user);
            if (newUser != null) {
                newUser.setPassword("");
            }
            return newUser;
        }
    }

    @Override
    public User faceRecognitionService(String imageBase64) {
        // 1. 调用人脸识别微服务
        String url = "http://127.0.0.1:5000/recognize";

        // 正确创建 HttpHeaders
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> request = new HashMap<>();
        request.put("image", imageBase64);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            // 2. 处理响应
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("uid")) {
                    // 处理不同的数字类型（可能是Integer/Long）
                    Object uidObj = body.get("uid");
                    long uid = 0;

                    if (uidObj instanceof Integer) {
                        uid = ((Integer) uidObj).longValue();
                    } else if (uidObj instanceof Long) {
                        uid = (Long) uidObj;
                    } else if (uidObj instanceof String) {
                        uid = Long.parseLong((String) uidObj);
                    }

                    // 3. 根据UID查询用户
                    Optional<User> user = userDao.findById(uid);
                    if (user.isPresent()) {
                        User foundUser = user.get();
                        foundUser.setPassword("");
                        return foundUser;
                    }
                }
            }
        } catch (Exception e) {
            // 处理异常情况
            e.printStackTrace();
        }
        return null; // 识别失败返回null
    }
}
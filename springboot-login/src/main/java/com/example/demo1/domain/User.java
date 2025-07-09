//domain中的User.java
package com.example.demo1.domain;

import jakarta.persistence.*;

@Table(name = "user")
@Entity
public class User {
    // 注意属性名要与数据表中的字段名一致
    // 主键自增int(10)对应long
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long uid;

    // 用户名属性varchar对应String
    private String uname;

    // 密码属性varchar对应String
    private String password;

    // 密码哈希字段
    private String passwordHash;

    // 添加无参构造函数，Spring Boot反序列化需要
    public User() {
    }

    // 添加带参构造函数
    public User(String uname, String password) {
        this.uname = uname;
        this.password = password;
        this.passwordHash = password; // 简单处理，实际应该加密
    }

    // 添加带参构造函数（包含passwordHash）
    public User(String uname, String password, String passwordHash) {
        this.uname = uname;
        this.password = password;
        this.passwordHash = passwordHash;
    }

    public long getUid() {
        return uid;
    }

    public void setUid(long uid) {
        this.uid = uid;
    }

    public String getUname() {
        return uname;
    }

    public void setUname(String uname) {
        this.uname = uname;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
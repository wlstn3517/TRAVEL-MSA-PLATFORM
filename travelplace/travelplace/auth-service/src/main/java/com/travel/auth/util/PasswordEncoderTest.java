package com.travel.auth.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/*
 관리자 계정 비밀번호 암호화 생성용
 한번 실행 후 값 복사해서 DB insert
 */
public class PasswordEncoderTest {

    public static void main(String[] args) {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPassword = "admin1234!@#$";// admin password

        String encoded = encoder.encode(rawPassword);

        System.out.println(encoded);
    }
}

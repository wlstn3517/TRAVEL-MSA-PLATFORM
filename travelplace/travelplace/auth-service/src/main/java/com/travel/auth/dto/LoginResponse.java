package com.travel.auth.dto;

/*
 로그인 응답 DTO
 */
public class LoginResponse {

    private String tokenType;
    private String accessToken;
    private long expiresInMs;
    private String role;

    /*
     username 필드 추가 이유
     - 일반 로그인: 프론트에서 localStorage.setItem("username", data.username) 사용
     - 구글 로그인: 이메일이 username으로 저장되므로 응답에 포함 필요
    */
    private String username;

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public long getExpiresInMs() {
        return expiresInMs;
    }

    public void setExpiresInMs(long expiresInMs) {
        this.expiresInMs = expiresInMs;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}

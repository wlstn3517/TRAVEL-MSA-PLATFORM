# Travel MSA Platform

Spring Cloud 기반 **MSA 아키텍처로 구현한 여행지 정보 플랫폼**입니다.

사용자는 여행지 정보를 검색하고 조회할 수 있으며 로그인 및 마이페이지 기능을 사용할 수 있습니다.
관리자는 관리자 페이지를 통해 **사용자 관리, 쿠폰 정책 관리, 배치 로그 조회** 등의 기능을 수행할 수 있습니다.

---

# Architecture

```
TRAVEL-MSA-PLATFORM
├── travel (React Frontend)
└── travelplace (Spring Boot MSA Backend)
    ├── eureka-server
    ├── gateway-service
    ├── auth-service
    ├── travel-service
    ├── admin-service
    └── batch-service
```

## System Flow

```
React Frontend
      │
      ▼
Spring Cloud Gateway
      │
      ▼
Eureka Service Discovery
      │
      ▼
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ Auth Service  │ Travel Service│ Admin Service │ Batch Service │
└───────────────┴───────────────┴───────────────┴───────────────┘
```

---

# Frontend

React 기반 사용자 및 관리자 UI

## 주요 기능

* 여행지 검색
* 여행지 상세 조회
* 로그인 / 회원가입
* Google OAuth 로그인
* 마이페이지
* 최근 본 여행지 조회
* 쿠폰 발급
* 관리자 페이지

---

# Backend Services

## Eureka Server

서비스 디스커버리 서버

### 역할

* 서비스 등록
* 서비스 탐색
* 서비스 상태 관리

---

## Gateway Service

Spring Cloud Gateway 기반 API Gateway

### 역할

* API Gateway
* 서비스 라우팅
* 클라이언트 요청 분산

---

## Auth Service

사용자 인증 및 계정 관리 서비스

### 주요 기능

* 회원가입
* 로그인
* JWT Access Token 발급
* Refresh Token 관리
* Google OAuth 로그인
* 사용자 정보 조회
* 사용자 정보 수정

---

## Travel Service

여행 도메인 서비스

### 주요 기능

* 여행지 목록 조회
* 여행지 상세 조회
* 여행지 검색
* 쿠폰 발급
* 사용자 쿠폰 조회
* 최근 본 여행지 기록
* 최근 본 여행지 조회

---

## Admin Service

관리자 기능 서비스

### 주요 기능

* 사용자 관리
* 쿠폰 정책 관리
* 관리자 대시보드
* 배치 로그 조회

---

## Batch Service

외부 API 데이터 동기화를 담당하는 배치 서비스

### 주요 기능

* 한국관광공사 Open API 데이터 수집
* 여행지 데이터 DB 적재
* 배치 실행 로그 기록
* 엑셀 다운로드
* JOB 비동기 처리

---

# Technology Stack

## Frontend

* React
* Axios
* Kakao Map API

## Backend

* Spring Boot
* Spring Cloud Gateway
* Eureka Service Discovery
* Spring Security
* JWT Authentication
* MyBatis

## Database

* MariaDB

## External API

* 한국관광공사 Open API
* Google OAuth
* Kakao Map API

---

# Run

## Frontend

```
cd travel
npm install
npm run dev
```

## Backend

각 서비스별로 실행합니다.

### 실행 순서

1. eureka-server 실행
2. gateway-service 실행
3. auth-service 실행
4. travel-service 실행
5. admin-service 실행
6. batch-service 실행

---

# Project Goal

Spring Cloud 기반 MSA 구조를 통해 **여행지 데이터 플랫폼을 구축하고
Service Discovery, API Gateway, 서비스 분리 구조를 구현하는 것을 목표로 합니다.**

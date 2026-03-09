package com.travel.service;

import com.travel.api.TourApiClient;
import com.travel.domain.TravelPlace;
import com.travel.domain.BatchLog;
import com.travel.dto.TourApiItem;
import com.travel.dto.TourApiResponse;
import com.travel.mapper.TravelPlaceMapper;
import com.travel.mapper.BatchLogMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/*
 관광공사 API 데이터 동기화 배치 서비스
 외부 관광공사 API 호출 후 DB 적재
 페이지 반복 처리 포함
 동시 실행 방지 락 적용
 배치 실행 로그 저장
 API 호출 제한 대응 sleep retry 적용
*/
@Service
@RequiredArgsConstructor
public class TourApiBatchServiceImpl implements TourApiBatchService {

    // 외부 관광공사 API 호출 전용 클라이언트
    private final TourApiClient tourApiClient;

    // 여행지 DB 저장용 MyBatis Mapper
    private final TravelPlaceMapper travelPlaceMapper;

    // 배치 실행 로그 기록용 Mapper
    private final BatchLogMapper batchLogMapper;

    @Override
    public void executeBatch() {

        System.out.println("Tour API Batch 실행");

        // 동시 실행 방지용 DB Named Lock 이름
        // 동일 이름으로 여러 배치 실행 시 하나만 허용
        String lockName = "TOUR_API_SYNC_LOCK";

        // DB Named Lock 획득 시도
        // 성공 시 1 반환 실패 시 null 또는 0
        Integer lockResult = batchLogMapper.getNamedLock(lockName);

        // 이미 실행 중이면 배치 종료
        if (lockResult == null || lockResult.intValue() != 1) {
            System.out.println("이미 실행 중이라 배치를 종료함");
            return;
        }

        // 배치 시작 로그 객체 생성
        BatchLog log = new BatchLog();
        log.setBatchName("TOUR_API_SYNC");

        // 배치 시작 로그 DB 기록
        batchLogMapper.insertBatchStart(log);

        // 전체 처리 데이터 누적 건수 저장 변수
        int processedCount = 0;

        try {

            // 페이지 반복 처리를 위한 시작 페이지 번호
            int pageNo = 1;

            // API 호출 시 한 페이지당 데이터 건수
            // TourApiClient numOfRows 값과 반드시 동일해야 함
            int numOfRows = 1000;

            // 전체 데이터 건수 저장 변수
            int totalCount = 0;

            // API 호출 실패 대비 retry 최대 횟수 설정
            int maxRetry = 3;

            // 전체 페이지 반복 처리 시작
            while (true) {

                String result = null;
                TourApiResponse response = null;

                // API 호출 retry 처리 루프
                // 네트워크 오류 또는 API 응답 오류 대비
                for (int retry = 1; retry <= maxRetry; retry++) {

                    try {

                        // 외부 관광공사 API 호출
                        result = tourApiClient.callAreaBasedList(pageNo);

                        // JSON 문자열 DTO 변환
                        response = tourApiClient.parseResponse(result);

                        // 정상 응답 코드 확인
                        if (response != null &&
                                "0000".equals(response.getResponse()
                                                      .getHeader()
                                                      .getResultCode())) {
                            break;
                        }

                        System.out.println("API 응답 실패 retry " + retry);

                    } catch (Exception e) {

                        // 네트워크 오류 등 예외 발생 시 retry
                        System.out.println("API 호출 예외 retry " + retry);
                    }

                    // retry 간 호출 제한 sleep 처리
                    // 공공 API 호출 제한 대응 목적
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }

                // retry 모두 실패 시 배치 종료
                if (response == null) {
                    System.out.println("API retry 실패 배치 종료");
                    break;
                }

                // 첫 페이지에서 전체 데이터 건수 확인
                // 이후 페이지 종료 조건 계산에 사용
                if (pageNo == 1) {
                    totalCount = response.getResponse()
                                         .getBody()
                                         .getTotalCount();
                    System.out.println("전체 데이터 건수 " + totalCount);
                }

                // 관광지 데이터 배열 추출
                TourApiItem[] items =
                        response.getResponse().getBody().getItems().getItem();

                // 데이터 없으면 반복 종료
                if (items == null || items.length == 0) {
                    System.out.println("데이터 없음");
                    break;
                }

                // DTO 데이터를 내부 엔티티로 변환 후 DB 저장
                for (TourApiItem item : items) {

                    TravelPlace place = new TravelPlace();

                    // 관광공사 컨텐츠 ID
                    place.setContentId(item.getContentid());

                    // 여행지 이름
                    place.setTitle(item.getTitle());

                    // 지역 코드
                    place.setAreaCode(item.getAreacode());

                    // 시군구 코드
                    place.setSigunguCode(item.getSigungucode());

                    // 주소 정보
                    place.setAddr1(item.getAddr1());
                    place.setAddr2(item.getAddr2());

                    // 카테고리 분류
                    place.setCat1(item.getCat1());
                    place.setCat2(item.getCat2());
                    place.setCat3(item.getCat3());

                    // 대표 이미지 정보
                    place.setFirstImage(item.getFirstimage());
                    place.setFirstImage2(item.getFirstimage2());

                    // 지도 좌표 정보
                    place.setMapX(item.getMapx());
                    place.setMapY(item.getMapy());

                    // 데이터 생성 수정 시간
                    place.setCreatedTime(item.getCreatedtime());
                    place.setModifiedTime(item.getModifiedtime());

                    // 관광 컨텐츠 타입
                    place.setContentTypeId(item.getContenttypeid());

                    // DB 저장 처리
                    travelPlaceMapper.insertTravelPlace(place);

                    // 처리 건수 누적
                    processedCount++;
                }

                System.out.println("조회 건수 " + items.length);

                // 다음 페이지 이동
                pageNo++;

                // API 호출 과부하 방지 sleep 처리
                // 공공데이터 API 정책 대응
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }

                // 전체 데이터 처리 완료 여부 판단
                if ((pageNo - 1) * numOfRows >= totalCount) {
                    System.out.println("전체 페이지 처리 완료");
                    break;
                }
            }

            // 정상 완료 로그 기록
            log.setStatus("SUCCESS");
            log.setProcessedCount(processedCount);
            log.setErrorMessage(null);

        } catch (Exception e) {

            // 배치 실행 중 예외 발생 시 실패 로그 기록
            log.setStatus("FAIL");
            log.setProcessedCount(processedCount);
            log.setErrorMessage(e.getMessage());

        } finally {

            // 배치 종료 로그 업데이트
            batchLogMapper.updateBatchEnd(log);

            // DB Named Lock 해제
            batchLogMapper.releaseNamedLock(lockName);
        }
    }
}

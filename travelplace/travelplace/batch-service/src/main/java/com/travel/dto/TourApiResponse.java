package com.travel.dto;

import lombok.Data;

@Data
public class TourApiResponse {
	private Response response; // 최상위 "response"

	@Data
	public static class Response {
		private Header header;
		private Body body;
	}

	@Data
	public static class Header {
		private String resultCode;
		private String resultMsg;
	}

	@Data
	public static class Body {
		private Items items;
		private Integer numOfRows;
		private Integer pageNo;
		private Integer totalCount;
	}

	@Data
	public static class Items {
		private TourApiItem[] item; // 응답이 배열로 오는 케이스가 흔함
	}
}

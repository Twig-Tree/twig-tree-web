import { type LectureLogEvent } from "./logEvents";

/*
로그를 보낼 곳. 수집 서비스를 붙일 때 setLectureLogSink로 넣는다. 네트워크로 보내는 sink는 Promise를 돌려줄 수 있다.
*/
export type LectureLogSink = (event: LectureLogEvent) => void | Promise<void>;

/*
함수 이름 : writeLectureLogToConsole
기능 : 로그 이벤트를 수준에 맞는 콘솔 함수로 찍는다.
인자 : LectureLogEvent event -> 로그 이벤트
반환값 : 없음
*/
const writeLectureLogToConsole: LectureLogSink = (event) => {
  const write =
    event.level === "error"
      ? console.error
      : event.level === "warn"
        ? console.warn
        : console.info;

  write(`[lecture] ${event.type}`, event);
};

/*
수집을 붙이기 전의 기본값. 개발 환경은 모든 이벤트를, 그 밖에서는 오류만 콘솔에 찍는다.
오류까지 버리면 수집이 없는 동안 재생 실패를 알아챌 방법이 없다.
*/
const defaultLectureLogSink: LectureLogSink = (event) => {
  if (process.env.NODE_ENV === "development" || event.level === "error") {
    writeLectureLogToConsole(event);
  }
};

let lectureLogSink: LectureLogSink = defaultLectureLogSink;

/*
함수 이름 : setLectureLogSink
기능 : 로그를 보낼 곳을 바꾼다. null이면 기본값(콘솔)으로 되돌린다.
인자 : LectureLogSink | null sink -> 새 로그 sink
반환값 : 없음
*/
export const setLectureLogSink = (sink: LectureLogSink | null) => {
  lectureLogSink = sink ?? defaultLectureLogSink;
};

/*
함수 이름 : logLectureEvent
기능 : 로그 이벤트를 지금 sink로 보낸다. sink가 던지거나 Promise가 거부돼도 강의 흐름은 멈추지 않는다. 기다리지 않는다.
인자 : LectureLogEvent event -> 로그 이벤트
반환값 : 없음
*/
export const logLectureEvent = (event: LectureLogEvent) => {
  const reportFailure = (error: unknown) =>
    console.error("강의 로그를 보내지 못했습니다.", error);

  try {
    void Promise.resolve(lectureLogSink(event)).catch(reportFailure);
  } catch (error) {
    reportFailure(error);
  }
};

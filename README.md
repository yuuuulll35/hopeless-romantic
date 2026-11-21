# 사랑꾼 자가진단표

당신은 얼마나 사랑꾼인가요? NPC가 스스로 매긴 사랑꾼 지수를 시험지 한 장으로 채점해 보는 OOC 결과 뷰어 — 빌드 없는 HTML/CSS/JavaScript.

**https://yuuuulll35.github.io/hopeless-romantic/**

AI 채팅에서 OOC로 받은 자가진단 답을 넣으면 NPC의 손글씨 답안 위에 빨간펜 팩트체크(실제 행동과 실제 점수)가 채점되고, 유형 도장과 마지막 심정이 공책 한 장으로 나온다.

## 사용법

1. **OOC ① 복사** → 롤플 중인 AI 채팅에 보낸다. NPC가 직접 쓴 답안(점수와 코멘트)이 오면 답을 복사하고 **답 붙여넣기**를 누른다.
2. **OOC ② 복사** → 한 번 더 보낸다. 빨간펜 팩트체크(실제 행동과 실제 점수), 유형 판정, 마지막 심정이 오면 같은 방식으로 넣는다. OOC ②에는 NPC가 매긴 점수와 총점이 함께 들어간다.
3. **채점 시작**. 결과 화면 위쪽 **빨간펜 팩트체크** 스위치로 NPC의 답안만 볼 수도 있다. 두 답을 모두 넣어야 버튼이 켜진다.

답은 넣는 즉시 검사해서 빠진 항목이 있으면 바로 알려 준다. 브라우저가 클립보드 읽기를 막으면 **직접 붙여넣기**로 입력 칸을 연다.

처음 화면의 **예시로 보기**는 예시 답으로 바로 채점한다. 마지막으로 채점한 답은 브라우저에 저장되어 처음 화면의 **지난 답안지 다시 보기**로 돌아온다.

## OOC 답 형식

채팅에서 표로 바뀌지 않도록 `|` 구분 없이 한 항목 한 줄로 받는다.

OOC ① 답안:

```text
이름: NPC 이름 / PC 이름
손글씨: 무심
항목 1 [내 점수: 3/10] (코멘트: …)
…
항목 10 [내 점수: 6/10] (코멘트: …)
```

OOC ② 팩트체크:

```text
항목 1 [실제 점수: 8/10] (실제 행동: …)
…
항목 10 [실제 점수: 10/10] (실제 행동: …)
[사랑꾼 유형 판정]: 유형 이름 (이유: 한 문장)
[마지막 심정 서술]: 총점을 확인한 순간의 내면 심리 (여러 줄 가능)
```

- `손글씨`는 NPC 성격에 맞는 필체 유형이다. 단정, 어른, 무심, 예민, 다정, 발랄, 호쾌, 거침, 소심, 엉뚱 중 하나를 AI가 고르고, 답안지의 손글씨 폰트가 그에 맞춰 바뀐다. 없으면 단정으로 쓴다.
- 총점, 실제 총점, 자기객관화 지수(100 − 항목별 점수 차이의 합)는 사이트가 계산한다.
- 자기 점수와 실제 점수가 1점 이내면 동그라미, 그보다 벌어지면 빗금이 그어진다.
- 파서는 코드블록, 앞뒤 잡문, `**굵게**`, 항목 이름과 질문이 함께 적힌 줄을 허용한다.

## 실행

저장소 루트를 그대로 정적 호스팅(GitHub Pages 등)한다. ES 모듈을 쓰므로 `file://`로는 열리지 않는다.

```bash
python3 -m http.server 8000
```

## 구조

```
index.html     화면 구조 (처음 화면, 시험지, 공책)
styles.css     디자인
js/app.js      화면 전환, 채점 표시, 저장
js/ooc.js      OOC 만들기와 AI 답 파서
js/data.js     진단 항목, 예시 답
```

## 폰트

폰트 파일은 저장소에 포함되지 않고 모두 외부에서 불러옵니다.

SIL Open Font License 1.1을 따르는 폰트:

| 폰트 | 쓰임 | 저작권 | 제공 |
|---|---|---|---|
| [Pretendard](https://github.com/orioncactus/pretendard) | 본문 | © Kil Hyung-jin | jsDelivr |
| [Black Han Sans](https://fonts.google.com/specimen/Black+Han+Sans) | 제목, 도장 | © Zess Type | Google Fonts |
| [Nanum Pen Script](https://fonts.google.com/specimen/Nanum+Pen+Script) | 빨간펜 점수, 낙서 | © NAVER Corp. | Google Fonts |
| [Gaegu](https://fonts.google.com/specimen/Gaegu) | 해시태그, 손글씨 대체 글꼴 | © JIKJI | Google Fonts |

NPC 손글씨 폰트는 [눈누](https://noonnu.cc)에 등록된 무료 폰트로, 각 제작사의 라이선스를 따릅니다(웹사이트 사용과 임베딩 허용). 눈누가 안내하는 웹폰트 주소로 불러옵니다.

| 폰트 | 쓰임 | 저작권 | 제공 |
|---|---|---|---|
| [이서윤체](https://noonnu.cc/font_page/872) | NPC 손글씨 (단정) | © 흥국생명 | jsDelivr (눈누 웹폰트) |
| [교보손글씨 2019](https://noonnu.cc/font_page/419) | NPC 손글씨 (어른) | © 교보문고 | jsDelivr (눈누 웹폰트) |
| [부산단디손글씨](https://noonnu.cc/font_page/1991) | NPC 손글씨 (무심) | © 부산시청 | jsDelivr (눈누 웹폰트) |
| [교보문고 손글씨 2025 이유빈](https://noonnu.cc/font_page/1812) | NPC 손글씨 (예민) | © 교보문고 | jsDelivr (눈누 웹폰트) |
| [그리운X국한박 신고양이](https://noonnu.cc/font_page/1888) | NPC 손글씨 (다정) | © 그리운 X 국립한글박물관 | jsDelivr (눈누 웹폰트) |
| [온글잎 박다현체](https://noonnu.cc/font_page/1541) | NPC 손글씨 (발랄) | © 온글잎 | jsDelivr (눈누 웹폰트) |
| [독립체](https://noonnu.cc/font_page/338) | NPC 손글씨 (호쾌) | © 윤디자인M | jsDelivr (눈누 웹폰트) |
| [그리운 옥수니 손글씨](https://noonnu.cc/font_page/1895) | NPC 손글씨 (거침) | © 그리운 X 밍주밍 | jsDelivr (눈누 웹폰트) |
| [온글잎 윤탱체](https://noonnu.cc/font_page/1918) | NPC 손글씨 (소심) | © 온글잎 | jsDelivr (눈누 웹폰트) |
| [꾸불림체](https://noonnu.cc/font_page/1500) | NPC 손글씨 (엉뚱) | © 우아한형제들 | jsDelivr (눈누 웹폰트) |

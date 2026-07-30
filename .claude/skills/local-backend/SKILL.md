---
name: local-backend
description: Bring the local backend server up to date and running via docker compose — pick the right branch (open PR branch or develop), pull, and rebuild. Use when the user asks to start/restart the local backend, refresh it to a branch, check the Swagger/API spec, or when a task needs the backend running (e.g. "백엔드 띄워줘", "로컬 서버 최신으로 올려줘", "스웨거 확인해줘").
---

# 로컬 백엔드 서버 실행

백엔드 저장소(`BE-twig-tree`)는 루트의 `compose.yaml`로 docker compose를 실행한다. 서버는 `http://localhost:8080`에 뜨고, API 스펙은 `http://localhost:8080/v3/api-docs` (사람이 볼 때는 `http://localhost:8080/swagger-ui/index.html`)에서 확인한다.

## 백엔드 저장소 경로 찾기

경로는 사람마다 다르므로 하드코딩하지 않고 아래 순서로 찾는다.

1. `BE_TWIG_TREE_PATH` 환경변수가 설정되어 있으면 그 경로를 쓴다.
2. 없으면 이 프로젝트와 형제 디렉터리에 있다고 보고 찾는다 — 프론트엔드 저장소 루트(`git rev-parse --show-toplevel`) 기준 `../BE-twig-tree`.
3. 두 방법 다 실패하면 추측하지 말고 사용자에게 백엔드 저장소 경로를 물어본다. 반복해서 묻지 않으려면 `BE_TWIG_TREE_PATH`를 설정해두라고 안내한다.

찾은 경로에 `compose.yaml`이 실제로 있는지 확인한 뒤 진행한다.

## 브랜치 선택

1. 백엔드 저장소에서 `git fetch --all --prune`으로 최신 원격 브랜치 정보를 받는다.
2. `gh pr list --repo Twig-Tree/BE-twig-tree --state open`과 원격 브랜치 목록(`git branch -r`)을 보고, 지금 하려는 작업과 가장 관련 있어 보이는 브랜치 하나를 골라 사용자에게 확인받는다. 브랜치명·PR 제목의 키워드가 작업 도메인과 겹치는 것을 우선한다(예: 메모 작업이면 `feat/memo/#21`).
   - 뚜렷한 후보가 없거나, 관련 작업이 이미 머지되어 열린 브랜치/PR이 없으면 `develop`을 기본값으로 제안한다.
   - 사용자가 브랜치를 직접 지정했다면 그대로 쓴다.
   - 후보를 하나 제시하고 "이 브랜치 맞나요?"라고만 물어본다 — 열린 브랜치를 전부 나열해 고르게 하지 않는다.

## 실행

브랜치를 한 번 확인받은 뒤로는 아래 단계를 다시 묻지 않고 진행한다.

1. 백엔드 저장소에 커밋되지 않은 변경이 있는지 `git status`로 확인한다. 있으면 checkout으로 덮어쓰지 않고 사용자에게 먼저 알린다.
2. `git checkout <branch>` 후 `git pull`한다.
3. `docker compose up --build`를 백그라운드로 실행한다. 빌드에 몇 분 걸릴 수 있다.
4. `http://localhost:8080/v3/api-docs`가 응답할 때까지 확인한다. 응답이 없으면 docker compose 로그에서 실패 원인을 찾아 사용자에게 알린다.
5. 어떤 브랜치로 띄웠는지, 서버가 정상인지 사용자에게 알려준다.

## 스펙 확인

`/v3/api-docs`는 OpenAPI JSON이라 그대로 읽기 번거롭다. 이 환경에는 `jq`가 없고 `python3`는 Windows 경로 처리가 까다로우므로, JSON 파싱에는 `node -e`를 사용한다.

```bash
curl -s http://localhost:8080/v3/api-docs --max-time 5 -o "<scratchpad>/api-docs.json"
node -e "
const d = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
for (const [path, methods] of Object.entries(d.paths)) {
  for (const [method, spec] of Object.entries(methods)) {
    console.log(method.toUpperCase(), path, '-', spec.summary || '');
  }
}
" "<scratchpad>/api-docs.json"
```

요청·응답 스키마는 `d.components.schemas`에서 확인한다.

## 주의

- 백엔드 코드는 이미지에 빌드되어 들어가므로, 브랜치만 바꾸고 컨테이너를 재시작하지 않으면 변경이 반영되지 않는다. 브랜치를 바꿨으면 반드시 `--build`로 다시 올린다.
- 한국어가 포함된 JSON 본문을 `curl -d`로 인라인 전달하면 인코딩이 깨져 서버가 `Invalid UTF-8` 오류를 반환할 수 있다. 본문을 파일에 쓰고 `--data-binary "@<file>"`로 보낸다.
- 백엔드 저장소는 이 프로젝트와 별개 저장소다. 커밋·push 같은 쓰기 작업은 사용자가 명시적으로 요청하지 않으면 하지 않는다.

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
3. `docker compose up --build -d`를 실행한다. `-d`로 컨테이너를 detach시켜야 다음 단계(스펙 확인)로 바로 진행할 수 있다. 빌드에 몇 분 걸릴 수 있다.
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

## 문제 해결

### Docker 데몬이 죽어 있을 때

`docker compose`가 아래처럼 실패하면 Docker Desktop이 실행되어 있지 않은 것이다.

```text
unable to get image 'postgres:16': error during connect: ... open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

`C:\Program Files\Docker\Docker\Docker Desktop.exe`를 실행한 뒤 데몬이 준비될 때까지 기다린다.

대기는 PowerShell의 `Start-Sleep` 반복 대신 Bash 도구의 until 루프를 background로 돌린다. PowerShell 도구는 sleep 체이닝을 차단한다.

```bash
until docker info >/dev/null 2>&1; do sleep 3; done; echo "docker daemon ready"
```

### Docker Desktop이 stale 소켓 때문에 기동하지 못할 때

Docker Desktop 시작 직후 아래와 같은 오류 대화상자가 뜨면서 종료되는 경우가 있다.

```text
starting services: initializing Inference manager: listening on
unix://C:\Users\<user>\AppData\Local\Docker\run\dockerInference:
remove ...\dockerInference: The file cannot be accessed by the system.
```

원인은 이전에 Docker가 비정상 종료되면서 남은 **AF_UNIX 소켓 파일**이다. 0바이트 reparse point 형태로 남는데, 파일시스템이 이 파일을 열 수 없는 상태가 되어 Docker가 지우고 새로 만들지 못한다.

원인은 이전에 Docker가 비정상 종료되면서 남은 **AF_UNIX 소켓 파일**이다. 0바이트 reparse point 형태로 남는데, 파일시스템이 이 파일을 열 수 없는 상태가 되어 Docker가 지우고 새로 만들지 못한다.

**해결: 파일이 아니라 상위 디렉터리를 rename해서 비켜둔다.** 파일 자체는 지울 수 없지만 디렉터리 rename은 성공하며, Docker는 시작할 때 디렉터리와 소켓을 새로 만든다.

#### 반드시 한 번에 전부 치운다

Docker는 소켓을 **하나씩 순차적으로** 초기화하고 첫 실패에서 멈춘다. 그래서 대화상자에 나온 디렉터리만 치우면 다음 실행에서 그다음 소켓이 걸린다. 매번 재시작하면 그 사이의 강제 종료가 새 orphan을 만들어 문제가 재생산된다.

**대화상자에 뭐가 나왔든 알려진 디렉터리를 모두 rename하고 재시작은 한 번만 한다.**

```powershell
Get-Process -Name "Docker Desktop","com.docker.backend","docker" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 4

$stamp = Get-Date -Format yyyyMMddHHmmss
$targets = @(
  "$env:LOCALAPPDATA\Docker\run",
  "$env:LOCALAPPDATA\docker-secrets-engine"
)
foreach ($t in $targets) {
  if (-not (Test-Path $t)) { continue }
  $leaf = Split-Path $t -Leaf
  try { Rename-Item -Path $t -NewName "$leaf.stale-$stamp" -ErrorAction Stop; "renamed $leaf" }
  catch { "rename 실패 [$leaf]: " + $_.Exception.Message }
}

Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

그다음 데몬이 준비될 때까지 기다린다(위 "Docker 데몬이 죽어 있을 때"의 until 루프).

#### 재시작한 뒤에는 죽이지 않는다

**이것이 이 문제에서 가장 중요한 규칙이다.** `Stop-Process -Force`로 Docker를 죽이면 그 실행에서 만든 소켓이 또 orphan으로 남아 다음 시작을 막는다. 위 스크립트를 실행한 뒤에는 기다리기만 하고, 조급하게 종료 후 재시도하지 않는다.

평소에도 오류 대화상자의 `Quit` 버튼이나 트레이 메뉴로 정상 종료하는 편이 낫다.

#### 그래도 다른 소켓이 걸리면

위 목록에 없는 경로가 대화상자에 나오면 그 상위 디렉터리를 같은 방식으로 rename한다. 그리고 **이 문서의 `$targets` 목록에 추가**해 다음부터는 한 번에 처리되게 한다.

지금까지 확인된 소켓은 다음과 같다.

- `%LOCALAPPDATA%\Docker\run\dockerInference`
- `%LOCALAPPDATA%\Docker\run\userAnalyticsOtlpHttp.sock`
- `%LOCALAPPDATA%\docker-secrets-engine\engine.sock`

#### 시도하지 않을 방법

파일을 직접 지우려는 시도는 **모두 실패**한다: `Remove-Item -Force`, `rd /s /q`, `[System.IO.File]::Delete`, `\\?\` 확장 경로, `fsutil reparsepoint delete`, `robocopy /MIR`, 파일 `Rename-Item`. 전부 `The file cannot be accessed by the system` (Win32 error 1920)으로 끝난다. 디렉터리 rename만 통한다.

### rename해둔 stale 디렉터리 정리

rename으로 비켜둔 `run.stale-*`, `docker-secrets-engine.stale-*` 디렉터리는 안에 든 소켓 파일을 지울 수 없어 그대로 남는다. **0바이트라 용량을 차지하지 않고 Docker 동작에도 지장이 없으므로 그냥 두어도 된다.** Docker를 종료할 때마다 하나씩 늘어나는 게 거슬릴 때만 아래 절차로 정리한다.

파일시스템 수준의 복구가 필요해 관리자 권한과 재부팅이 따른다. 사용자가 직접 판단해서 실행할 일이므로 **에이전트는 이 명령을 대신 실행하지 않고 안내만 한다.**

#### 1. 관리자 PowerShell 열기

시작 메뉴에서 `PowerShell` 검색 → 우클릭 → `관리자 권한으로 실행`.

#### 2. 파일시스템 검사 예약

```powershell
chkdsk C: /f
```

C:는 사용 중인 볼륨이라 즉시 검사할 수 없다는 안내와 함께 다음에 재부팅할 때 검사할지 묻는다. `Y`를 입력하고 Enter를 누른다.

#### 3. 재부팅

재부팅 시 파란 화면에서 검사가 자동으로 진행된다. 볼륨 크기에 따라 몇 분에서 수십 분이 걸린다.

#### 4. 재부팅 후 삭제

검사가 끝나면 소켓 파일이 삭제 가능한 상태가 된다. 일반 PowerShell에서 실행해도 된다.

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Docker" -Directory -Filter "run.stale-*" | Remove-Item -Recurse -Force
Get-ChildItem $env:LOCALAPPDATA -Directory -Filter "docker-secrets-engine.stale-*" | Remove-Item -Recurse -Force
```

남은 폴더가 있는지 확인한다.

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Docker" -Directory -Filter "*.stale-*"
Get-ChildItem $env:LOCALAPPDATA -Directory -Filter "*docker*stale*"
```

아무것도 출력되지 않으면 정리가 끝난 것이다. 여전히 `The file cannot be accessed by the system`이 나면 검사가 해당 항목을 고치지 못한 경우이므로, 폴더를 그대로 두고 넘어간다.

## 주의

- 백엔드 코드는 이미지에 빌드되어 들어가므로, 브랜치만 바꾸고 컨테이너를 재시작하지 않으면 변경이 반영되지 않는다. 브랜치를 바꿨으면 반드시 `--build`로 다시 올린다.
- 한국어가 포함된 JSON 본문을 `curl -d`로 인라인 전달하면 인코딩이 깨져 서버가 `Invalid UTF-8` 오류를 반환할 수 있다. 본문을 파일에 쓰고 `--data-binary "@<file>"`로 보낸다.
- 백엔드 저장소는 이 프로젝트와 별개 저장소다. 커밋·push 같은 쓰기 작업은 사용자가 명시적으로 요청하지 않으면 하지 않는다.

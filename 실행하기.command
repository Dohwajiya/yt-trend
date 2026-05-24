#!/bin/bash
# yt-trend(짐풀기) 원클릭 실행 런처 — Finder에서 더블클릭하세요.

# Homebrew / /usr/local 의 node·npm 경로 보장
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# 이 스크립트가 있는 폴더(프로젝트 루트)로 이동
cd "$(dirname "$0")" || exit 1

echo "======================================"
echo "   yt-trend (짐풀기) 실행을 준비합니다"
echo "======================================"

# node 설치 확인
if ! command -v npm >/dev/null 2>&1; then
  echo "[오류] node/npm을 찾을 수 없습니다. https://nodejs.org 에서 설치 후 다시 시도하세요."
  echo "엔터를 누르면 창이 닫힙니다."
  read -r
  exit 1
fi

# 최초 실행이면 패키지 설치
if [ ! -d node_modules ]; then
  echo "[1/3] 최초 실행 — 패키지 설치 중... (몇 분 걸릴 수 있어요)"
  npm install || { echo "설치 실패. 엔터를 누르면 닫힙니다."; read -r; exit 1; }
fi

# 기존에 3000 포트를 쓰던 서버가 있으면 정리
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 서버가 뜬 뒤 브라우저 자동 열기 (백그라운드)
( sleep 4; open "http://localhost:3000" ) &

echo "[2/3] 개발 서버를 시작합니다 — 잠시 후 브라우저가 자동으로 열립니다."
echo "[3/3] 끄려면 이 창에서 Ctrl + C 를 누르거나 창을 닫으세요."
echo ""

# 개발 서버 실행 (이 창이 열려 있는 동안 작동)
npm run dev

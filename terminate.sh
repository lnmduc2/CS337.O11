#!/bin/bash
# FILE NÀY DÙNG ĐỂ TERMINATE TẤT CẢ API LIÊN QUAN

# Bước 1: Kết thúc tiến trình Meilisearch trong WSL
meili_pid=$(pgrep -f 'meilisearch')
if [ ! -z "$meili_pid" ]; then
  kill $meili_pid
fi

# Bước 2: Kết thúc tất cả các tiến trình "python.exe" và "node.exe" trong Windows
cmd.exe /C taskkill /F /IM python.exe /T
cmd.exe /C taskkill /F /IM node.exe /T

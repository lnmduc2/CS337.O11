#!/bin/bash
# FILE NÀY DÙNG ĐỂ HOST CÁC API

# Định nghĩa đường dẫn gốc của dự án
BASE_PATH=$(dirname $(realpath $0))

# Chạy Meilisearch
cd $BASE_PATH/Backend/meili
./meilisearch --http-addr 0.0.0.0:8888 &

# Chạy FastAPI
fastapi_path=$(wslpath -w "$BASE_PATH/Backend")
cmd.exe /C "cd $fastapi_path && conda activate asr_app && python app.py" &

# Chạy React Web Server
react_path=$(wslpath -w "$BASE_PATH/Frontend/asr/src")
cmd.exe /C "cd $react_path && yarn start" &

# Chờ các dịch vụ khởi động
wait

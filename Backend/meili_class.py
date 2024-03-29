# MEILISEARCH FUNCTIONS UTILITIES
import json

import meilisearch


class Meilisearch:

    def __init__(self, index_name, port=None):
        self.index_name = index_name  # Tên (cũng có thể gọi là uid) của index
        if port is not None:
            self.client = meilisearch.Client(f'http://localhost:{port}')
        else:
            self.client = meilisearch.Client()

    
    # Kiểm tra tình trạng của meilisearch api
    def check_health_status(self) -> bool:
        return self.client.is_healthy()
    
    # Tạo một index mới (vd:OCR)
    def create(self, primary_key:str = "id"):
        self.client.create_index(uid=self.index_name, options={'primaryKey': primary_key})

    # Thêm JSON file vào index (file JSON phải chứa list của các dictionary, có khóa chính mặc định là "id")
    # Add một lần duy nhất, add xong đợi khoảng vài phút để hệ thống load lên meilisearch
    def insert(self, json_file_path:str):
        with open(json_file_path, encoding='utf-8') as json_file:
            data = json.load(json_file)
        self.client.index(self.index_name).update_documents(data)

    # Hàm xóa index
    def delete(self):
        self.client.delete_index(self.index_name)

    # Hàm query dựa trên query_text, lấy k phần tử có score cao nhất, trả về danh sách các document tìm thấy
    def search(self, query_text:str, k:int = 80) -> list:
        return self.client.index(self.index_name).search(
            query_text, 
            {"limit" : k}
        )["hits"]



Product Requirement Document (PRD)
Aplikasi Kontrol & Monitoring Berkas Gugatan

1. Tujuan Aplikasi
   Aplikasi ini dibuat untuk mengontrol dan memonitor alur berkas gugatan dari Panitera Pengganti (PP) ke Panitera Muda Gugatan (Panmud Gugatan) dan berlanjut ke Panitera Muda Hukum (Panmud Hukum). Aplikasi mencatat kegiatan serah terima, memudahkan monitoring status, dan menghasilkan rekap excel harian.

2. Pengguna Sistem
    - Panitera Pengganti (PP)
    - Panmud Gugatan
    - Panmud Hukum
    - Admin (opsional)

3. Fitur Utama
   A. Fitur Panitera Pengganti
   • Input berkas putusan: Nomor Perkara, Tanggal Putusan, Klasifikasi Perkara.
   • Validasi format Nomor Perkara (xxx/Pdt.G/2025/PA.Bjm).
   • Button 'Serahkan Berkas' untuk membuat tanda terima otomatis.
   • Tanda terima berisi tanggal serah terima + nama PP.
   • Tracking status berkas hingga selesai.

    B. Fitur Panmud Gugatan
    • Melihat daftar berkas masuk dari PP.
    • Verifikasi penerimaan berkas.
    • Input Tanggal PBT dan BHT.
    • Jika perkara Cerai Talak → Input Tanggal Ikrar.
    • Button 'Serahkan ke Panmud Hukum'.

    C. Fitur Panmud Hukum
    • Melihat daftar berkas dari Panmud Gugatan.
    • Verifikasi penerimaan berkas.
    • Download rekap excel harian.

4. User Stories
   A. User Story – Panitera Pengganti
    - Sebagai PP, saya ingin menginput nomor perkara, tanggal putusan, dan klasifikasi agar data putusan terekam.
    - Sebagai PP, saya ingin validasi format nomor perkara agar tidak salah input.
    - Sebagai PP, saya ingin mengklik tombol 'Serahkan Berkas' agar Panmud Gugatan mendapatkan berkas saya.
    - Sebagai PP, saya ingin mendapatkan tanda terima otomatis sebagai bukti serah terima.
    - Sebagai PP, saya ingin melihat status perkembangan berkas agar mengetahui progresnya.

    B. User Story – Panmud Gugatan
    - Sebagai Panmud Gugatan, saya ingin melihat daftar berkas masuk untuk memprioritaskan pekerjaan.
    - Sebagai Panmud Gugatan, saya ingin verifikasi penerimaan sebagai bukti bahwa berkas telah diterima.
    - Sebagai Panmud Gugatan, saya ingin mengisi tanggal PBT, BHT, dan ikrar (jika talak) agar data lengkap.
    - Sebagai Panmud Gugatan, saya ingin menyerahkan berkas ke Panmud Hukum dengan satu tombol.
    - Sebagai Panmud Gugatan, saya ingin sistem mencatat tanggal serah ke Panmud Hukum.

    C. User Story – Panmud Hukum
    - Sebagai Panmud Hukum, saya ingin melihat berkas yang siap diterima agar dapat memprosesnya.
    - Sebagai Panmud Hukum, saya ingin verifikasi penerimaan agar terdapat catatan digital.
    - Sebagai Panmud Hukum, saya ingin mengunduh Excel rekap harian untuk pelaporan.

5. Technical Specifications & API Usage

    A. Database Schema (Entities)
    - **Lawsuit (`lawsuits`)**
        - `id`: UUID
        - `case_number`: VARCHAR (Format: xxx/Pdt.G/yyyy/PA.Bjm)
        - `decision_date`: DATE
        - `classification`: VARCHAR
        - `status`: ENUM (DRAFT, SUBMITTED_TO_GUGATAN, RECEIVED_BY_GUGATAN, SUBMITTED_TO_HUKUM, RECEIVED_BY_HUKUM)
        - `pp_id`, `panmud_gugatan_id`, `panmud_hukum_id`: Foreign Keys to Users

    B. API Endpoints

    **1. Login (Existing Auth)**

    ```http
    POST /v1/auth/login
    Content-Type: application/json
    {
      "email": "pp@example.com",
      "password": "password"
    }
    ```

    **2. Users Management (`/v1/users`)**

    **a. Get Users List**
    - **URL**: `GET /v1/users`
    - **Headers**: `Authorization: Bearer <token>`
    - **Query Params**:
        - `page`: number (default: 1)
        - `limit`: number (default: 10)
        - `search`: string (optional, searches name/email)
        - `sortBy`: string (default: 'createdAt')
        - `sortType`: 'ASC' | 'DESC' (default: 'ASC')
    - **Response**:
        ```json
        {
          "message": "Users retrieved successfully",
          "payload": {
            "users": [
              {
                "id": "uuid",
                "fullName": "John Doe",
                "email": "john@example.com",
                "role": { "id": "uuid", "name": "Panitera Pengganti", "slug": "pantera-pengganti" },
                "createdAt": "..."
              }
            ],
            "metadata": { "page": 1, "limit": 10, "maxPages": 5, ... }
          }
        }
        ```

    **b. Create User (Super Admin)**
    - **URL**: `POST /v1/users`
    - **Headers**: `Authorization: Bearer <token>` (Super Admin only)
    - **Body**:
        ```json
        {
            "fullName": "Jane Doe",
            "email": "jane@example.com",
            "password": "password123" /* Min 6 chars */,
            "roleId": "uuid-of-role"
        }
        ```

    **c. Update User**
    - **URL**: `PUT /v1/users`
    - **Headers**: `Authorization: Bearer <token>`
    - **Body**:
        ```json
        {
            "id": "uuid-of-user-to-update" /* Required */,
            "fullName": "Jane Updated",
            "email": "newemail@example.com",
            "password": "newpassword123",
            "roleId": "uuid-of-new-role"
        }
        ```
    - **Note**: All fields in body except `id` are optional.

    **3. Lawsuit Workflows (`/v1/lawsuits`)**

    **a. Create Lawsuit (Panitera Pengganti)**
    - **URL**: `POST /v1/lawsuits`
    - **Body**:
        ```json
        {
            "caseNumber": "123/Pdt.G/2025/PA.Bjm",
            "decisionDate": "2025-01-01",
            "classification": "Cerai Talak"
        }
        ```

    **b. Handover to Panmud Gugatan**
    - **URL**: `POST /v1/lawsuits/:id/handover`
    - **Role**: `Panitera Pengganti`

    **c. Receive Lawsuit (Panmud Gugatan)**
    - **URL**: `POST /v1/lawsuits/:id/receive`
    - **Role**: `Panmud Gugatan`

    **d. Update Lawsuit Details**
    - **URL**: `PATCH /v1/lawsuits/:id`
    - **Role**: `Panmud Gugatan`
    - **Body**:
        ```json
        {
            "pbtDate": "2025-01-05",
            "bhtDate": "2025-01-06",
            "ikrarDate": "2025-01-10"
        }
        ```

    **e. Handover to Panmud Hukum**
    - **URL**: `POST /v1/lawsuits/:id/handover`
    - **Role**: `Panmud Gugatan`

    **f. Receive Lawsuit (Panmud Hukum)**
    - **URL**: `POST /v1/lawsuits/:id/receive`
    - **Role**: `Panmud Hukum`

    **g. Download Report**
    - **URL**: `GET /v1/lawsuits/report`
    - **Role**: `Panmud Hukum`
    - **Response**: File download stream.

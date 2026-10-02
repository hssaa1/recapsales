<?php

header(
    "Content-Type: application/json; charset=utf-8"
);

require __DIR__ . "/db.php";


if (
    session_status() !==
    PHP_SESSION_ACTIVE
) {

    session_start();

}


function respond(
    array $data,
    int $status = 200
): void {

    http_response_code(
        $status
    );


    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );


    exit;

}


if (
    $_SERVER["REQUEST_METHOD"] !==
    "POST"
) {

    respond(
        [
            "success" => false,
            "message" => "Method tidak diizinkan."
        ],
        405
    );

}


$data =
    json_decode(
        file_get_contents(
            "php://input"
        ),
        true
    ) ?? [];


$username =
    trim(
        $data["username"] ?? ""
    );


$password =
    $data["password"] ?? "";


if (
    $username === "" ||
    $password === ""
) {

    respond(
        [
            "success" => false,
            "message" => "Username dan password wajib diisi."
        ],
        400
    );

}


try {

    $stmt =
        $pdo->prepare(
            "
            SELECT

                u.id,
                u.full_name,
                u.username,
                u.password,
                u.role,
                u.channel,
                u.sales_type,
                u.default_store_id,
                u.status,

                s.store_name AS default_store

            FROM users u

            LEFT JOIN stores s
                ON s.id = u.default_store_id

            WHERE u.username = ?

            LIMIT 1
            "
        );


    $stmt->execute([
        $username
    ]);


    $user =
        $stmt->fetch(
            PDO::FETCH_ASSOC
        );


    if (!$user) {

        respond(
            [
                "success" => false,
                "message" => "Username atau password salah."
            ],
            401
        );

    }


    /*
    =========================================================
    STATUS AKUN
    DATABASE MEMAKAI:
    Aktif / Nonaktif
    =========================================================
    */

    if (
        strtolower(
            trim(
                (string)$user["status"]
            )
        ) !== "aktif"
    ) {

        respond(
            [
                "success" => false,
                "message" => "Akun tidak aktif."
            ],
            403
        );

    }


    /*
    =========================================================
    PASSWORD
    =========================================================
    */

    if (
        !password_verify(
            $password,
            $user["password"]
        )
    ) {

        respond(
            [
                "success" => false,
                "message" => "Username atau password salah."
            ],
            401
        );

    }


    /*
    =========================================================
    SESSION
    =========================================================
    */

    session_regenerate_id(
        true
    );


    $_SESSION["logged_in"] =
        true;


    $_SESSION["user_id"] =
        (int)$user["id"];


    $_SESSION["username"] =
        $user["username"];


    $_SESSION["full_name"] =
        $user["full_name"];


    $_SESSION["role"] =
        $user["role"];


    $_SESSION["channel"] =
        $user["channel"];


    $_SESSION["sales_type"] =
        $user["sales_type"];


    $_SESSION["default_store_id"] =
        $user["default_store_id"] !== null
            ? (int)$user["default_store_id"]
            : null;


    unset(
        $user["password"]
    );


    $user["id"] =
        (int)$user["id"];


    if (
        $user["default_store_id"] !==
        null
    ) {

        $user["default_store_id"] =
            (int)$user["default_store_id"];

    }


    respond(
        [
            "success" => true,
            "logged_in" => true,
            "user" => $user
        ]
    );


} catch (
    Throwable $error
) {

    respond(
        [
            "success" => false,
            "message" => $error->getMessage()
        ],
        500
    );

}
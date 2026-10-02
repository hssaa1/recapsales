<?php

header(
    "Content-Type: application/json; charset=utf-8"
);


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


/*
=========================================================
HAPUS SEMUA DATA SESSION
=========================================================
*/

$_SESSION = [];


/*
=========================================================
HAPUS COOKIE PHP SESSION
=========================================================
*/

if (
    ini_get(
        "session.use_cookies"
    )
) {

    $params =
        session_get_cookie_params();


    setcookie(
        session_name(),
        "",
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}


/*
=========================================================
DESTROY SESSION
=========================================================
*/

session_unset();

session_destroy();


respond(
    [
        "success" => true,
        "logged_in" => false,
        "message" => "Logout berhasil."
    ]
);
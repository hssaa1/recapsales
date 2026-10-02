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


/*
=========================================================
BELUM LOGIN
=========================================================
*/

if (
    empty(
        $_SESSION["logged_in"]
    )
    ||
    empty(
        $_SESSION["user_id"]
    )
) {

    respond(
        [
            "success" => true,
            "logged_in" => false,
            "user" => null
        ]
    );
}


/*
=========================================================
AMBIL USER TERBARU DARI DATABASE
=========================================================
*/

try {

    $stmt =
        $pdo->prepare(
            "
            SELECT

                u.id,
                u.full_name,
                u.username,
                u.role,
                u.channel,
                u.sales_type,
                u.default_store_id,
                u.status,

                s.store_name AS default_store

            FROM users u

            LEFT JOIN stores s
                ON s.id = u.default_store_id

            WHERE u.id = ?

            LIMIT 1
            "
        );


    $stmt->execute([
        (int)$_SESSION["user_id"]
    ]);


    $user =
        $stmt->fetch(
            PDO::FETCH_ASSOC
        );


    /*
    Session ada tetapi user sudah hilang.
    */

    if (!$user) {

        session_unset();

        session_destroy();


        respond(
            [
                "success" => true,
                "logged_in" => false,
                "user" => null
            ]
        );
    }


    /*
    User nonaktif.
    */

    if (
        isset(
            $user["status"]
        )
        &&
    strtolower(
        trim(
            (string)$user["status"]
        )
    ) !== "aktif"
    ) {

        session_unset();

        session_destroy();


        respond(
            [
                "success" => true,
                "logged_in" => false,
                "user" => null
            ]
        );
    }


    /*
    Sinkronkan session dengan database.
    */

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
            "logged_in" => false,
            "message" => $error->getMessage()
        ],
        500
    );
}
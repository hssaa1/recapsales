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


// =========================================================
// ADMIN ONLY
// =========================================================

if (
    (
        $_SESSION["logged_in"] ??
        false
    ) !== true

    ||

    (
        $_SESSION["role"] ??
        ""
    ) !== "Admin"
) {

    respond(
        [
            "success" => false,
            "message" =>
                "Hanya Admin yang dapat mengatur target."
        ],
        403
    );
}


// =========================================================
// POST
// =========================================================

if (
    $_SERVER["REQUEST_METHOD"] ===
    "POST"
) {

    $data =
        json_decode(
            file_get_contents(
                "php://input"
            ),
            true
        );


    $targetDate =
        trim(
            (string)(
                $data["target_date"] ??
                ""
            )
        );


    $product =
        trim(
            (string)(
                $data["product"] ??
                ""
            )
        );


    $dailyTarget =
        (int)(
            $data["daily_target"] ??
            0
        );


    if (
        !$targetDate ||
        !in_array(
            $product,
            [
                "XL Prioritas",
                "XLHome"
            ],
            true
        ) ||
        $dailyTarget < 0
    ) {

        respond(
            [
                "success" => false,
                "message" =>
                    "Data target tidak valid."
            ],
            422
        );
    }


    try {

        $stmt =
            $pdo->prepare(
                "
                INSERT INTO daily_targets
                (
                    target_date,
                    product,
                    daily_target
                )
                VALUES
                (
                    ?,
                    ?,
                    ?
                )

                ON DUPLICATE KEY UPDATE

                    daily_target =
                        VALUES(
                            daily_target
                        ),

                    updated_at =
                        CURRENT_TIMESTAMP
                "
            );


        $stmt->execute(
            [
                $targetDate,
                $product,
                $dailyTarget
            ]
        );


        respond(
            [
                "success" => true,
                "message" =>
                    "Target harian berhasil disimpan."
            ]
        );


    } catch (
        Throwable $error
    ) {

        respond(
            [
                "success" => false,
                "message" =>
                    $error->getMessage()
            ],
            500
        );
    }

}


respond(
    [
        "success" => false,
        "message" =>
            "Method tidak diizinkan."
    ],
    405
);
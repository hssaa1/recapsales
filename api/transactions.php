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


// =========================================================
// RESPONSE
// =========================================================

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
// METHOD
// =========================================================

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


// =========================================================
// SESSION CHECK
// =========================================================

$loggedIn =
    $_SESSION["logged_in"] ??
    false;


$userId =
    isset(
        $_SESSION["user_id"]
    )
        ? (int)$_SESSION["user_id"]
        : 0;


$role =
    $_SESSION["role"] ??
    "";


if (
    !$loggedIn ||
    $userId <= 0 ||
    !in_array(
        $role,
        [
            "Admin",
            "Sales"
        ],
        true
    )
) {

    respond(
        [
            "success" => false,
            "message" => "Session login tidak valid."
        ],
        401
    );
}


// =========================================================
// JSON BODY
// =========================================================

$raw =
    file_get_contents(
        "php://input"
    );


$data =
    json_decode(
        $raw,
        true
    );


if (
    !is_array(
        $data
    )
) {

    respond(
        [
            "success" => false,
            "message" => "Data JSON tidak valid."
        ],
        400
    );
}


// =========================================================
// INPUT
// =========================================================

$transactionDate =
    trim(
        (string)(
            $data[
                "transaction_date"
            ] ?? ""
        )
    );


$storeId =
    (int)(
        $data[
            "store_id"
        ] ?? 0
    );


$product =
    trim(
        (string)(
            $data[
                "product"
            ] ?? ""
        )
    );


$pricePlanId =
    (int)(
        $data[
            "price_plan_id"
        ] ?? 0
    );


$price =
    (float)(
        $data[
            "price"
        ] ?? 0
    );


$quantity =
    (int)(
        $data[
            "quantity"
        ] ?? 0
    );


$transactionType =
    trim(
        (string)(
            $data[
                "transaction_type"
            ] ?? ""
        )
    );


$notes =
    trim(
        (string)(
            $data[
                "notes"
            ] ?? ""
        )
    );


// =========================================================
// SALES ID
// =========================================================

/*
SALES:
harus pakai ID dari session.

ADMIN:
boleh memilih Sales dari frontend.
*/

if (
    $role ===
    "Sales"
) {

    $salesId =
        $userId;

} else {

    $salesId =
        (int)(
            $data[
                "sales_id"
            ] ?? 0
        );

}


// =========================================================
// VALIDATION
// =========================================================

if (
    $transactionDate === ""
) {

    respond(
        [
            "success" => false,
            "message" => "Tanggal transaksi wajib diisi."
        ],
        422
    );
}


if (
    $salesId <= 0
) {

    respond(
        [
            "success" => false,
            "message" => "Sales tidak valid."
        ],
        422
    );
}


if (
    $storeId <= 0
) {

    respond(
        [
            "success" => false,
            "message" => "Store wajib dipilih."
        ],
        422
    );
}


if (
    !in_array(
        $product,
        [
            "XL Prioritas",
            "XLHome"
        ],
        true
    )
) {

    respond(
        [
            "success" => false,
            "message" => "Produk tidak valid."
        ],
        422
    );
}


if (
    $pricePlanId <= 0
) {

    respond(
        [
            "success" => false,
            "message" => "Price Plan wajib dipilih."
        ],
        422
    );
}


if (
    $quantity <= 0
) {

    respond(
        [
            "success" => false,
            "message" => "Quantity minimal 1."
        ],
        422
    );
}


if (
    $transactionType === ""
) {

    respond(
        [
            "success" => false,
            "message" => "Tipe transaksi wajib dipilih."
        ],
        422
    );
}


// =========================================================
// SAVE
// =========================================================

try {

    // =====================================================
    // VALIDATE SALES
    // =====================================================

    $salesStmt =
        $pdo->prepare(
            "
            SELECT
                id,
                status

            FROM users

            WHERE
                id = ?

                AND

                role = 'Sales'

            LIMIT 1
            "
        );


    $salesStmt->execute(
        [
            $salesId
        ]
    );


    $sales =
        $salesStmt->fetch(
            PDO::FETCH_ASSOC
        );


    if (
        !$sales
    ) {

        respond(
            [
                "success" => false,
                "message" => "Data Sales tidak ditemukan."
            ],
            404
        );
    }


    if (
        strtolower(
            trim(
                (string)$sales[
                    "status"
                ]
            )
        ) !== "aktif"
    ) {

        respond(
            [
                "success" => false,
                "message" => "Akun Sales tidak aktif."
            ],
            403
        );
    }


    // =====================================================
    // VALIDATE STORE
    // =====================================================

    $storeStmt =
        $pdo->prepare(
            "
            SELECT
                id

            FROM stores

            WHERE
                id = ?

            LIMIT 1
            "
        );


    $storeStmt->execute(
        [
            $storeId
        ]
    );


    if (
        !$storeStmt->fetch()
    ) {

        respond(
            [
                "success" => false,
                "message" => "Store tidak ditemukan."
            ],
            404
        );
    }


    // =====================================================
    // VALIDATE PRICE PLAN
    // =====================================================

    $planStmt =
        $pdo->prepare(
            "
            SELECT
                id,
                product,
                price_plan,
                price

            FROM price_plans

            WHERE
                id = ?

            LIMIT 1
            "
        );


    $planStmt->execute(
        [
            $pricePlanId
        ]
    );


    $plan =
        $planStmt->fetch(
            PDO::FETCH_ASSOC
        );


    if (
        !$plan
    ) {

        respond(
            [
                "success" => false,
                "message" => "Price Plan tidak ditemukan."
            ],
            404
        );
    }


    // =====================================================
    // PRODUCT PLAN MUST MATCH
    // =====================================================

    if (
        trim(
            (string)$plan[
                "product"
            ]
        ) !==
        $product
    ) {

        respond(
            [
                "success" => false,
                "message" => "Price Plan tidak sesuai dengan produk."
            ],
            422
        );
    }


    // =====================================================
    // PLAN NAME
    // =====================================================

    $pricePlanName =
        trim(
            (string)$plan[
                "price_plan"
            ]
        );


    /*
    Harga dari frontend tetap diperbolehkan diedit.

    Kalau frontend mengirim harga <= 0,
    fallback ke harga database.
    */

    if (
        $price <= 0
    ) {

        $price =
            (float)$plan[
                "price"
            ];

    }


    // =====================================================
    // INSERT
    // =====================================================

    $insert =
        $pdo->prepare(
            "
            INSERT INTO transactions
            (
                transaction_date,
                user_id,
                store_id,
                price_plan_id,
                product,
                price_plan,
                price,
                quantity,
                transaction_type,
                notes
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
            "
        );


    $insert->execute(
        [

            $transactionDate,

            $salesId,

            $storeId,

            $pricePlanId,

            $product,

            $pricePlanName,

            $price,

            $quantity,

            $transactionType,

            $notes

        ]
    );


    $transactionId =
        (int)$pdo
            ->lastInsertId();


    // =====================================================
    // RETURN SAVED DATA
    // =====================================================

    $detail =
        $pdo->prepare(
            "
            SELECT

                t.id,

                t.transaction_date,

                t.user_id
                AS sales_id,

                u.full_name
                AS sales_name,

                u.sales_type,

                u.channel,

                t.store_id,

                s.store_name,

                t.price_plan_id,

                t.product,

                t.price_plan,

                t.price,

                t.quantity,

                t.transaction_type,

                t.notes,

                t.created_at

            FROM transactions t

            INNER JOIN users u
                ON u.id =
                t.user_id

            INNER JOIN stores s
                ON s.id =
                t.store_id

            WHERE
                t.id = ?

            LIMIT 1
            "
        );


    $detail->execute(
        [
            $transactionId
        ]
    );


    $transaction =
        $detail->fetch(
            PDO::FETCH_ASSOC
        );


    respond(
        [

            "success" => true,

            "message" =>
                "Transaksi berhasil disimpan.",

            "transaction" =>
                $transaction

        ],
        201
    );


} catch (
    Throwable $error
) {

    /*
    Jangan print Warning/Fatal HTML.
    Selalu kembalikan JSON.
    */

    respond(
        [

            "success" => false,

            "message" =>
                "Gagal menyimpan transaksi: " .
                $error->getMessage()

        ],
        500
    );

}
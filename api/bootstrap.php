<?php

// =========================================================
// BOOTSTRAP API
// =========================================================

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
// SESSION
// =========================================================

$role =
    $_SESSION["role"] ??
    "";


$userId =
    isset(
        $_SESSION["user_id"]
    )
        ? (int)$_SESSION["user_id"]
        : 0;


// =========================================================
// RESPONSE HELPER
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
// DATA DEFAULT
// =========================================================

$stores = [];

$sales = [];

$plans = [];

$transactions = [];

$visitors = [];

$targets = [];

$dailyTargets = [];

$salesRanking = [];


// =========================================================
// START
// =========================================================

try {

    // =====================================================
    // STORES
    // =====================================================

    $stores =
        $pdo
            ->query(
                "
                SELECT

                    id,
                    store_name

                FROM stores

                ORDER BY
                    store_name ASC
                "
            )
            ->fetchAll(
                PDO::FETCH_ASSOC
            );


    // =====================================================
    // SALES
    // =====================================================

    $sales =
        $pdo
            ->query(
                "
                SELECT

                    u.id,
                    u.full_name,
                    u.username,
                    u.channel,
                    u.sales_type,
                    u.default_store_id,

                    s.store_name
                    AS default_store

                FROM users u

                LEFT JOIN stores s
                    ON s.id =
                    u.default_store_id

                WHERE

                    u.role =
                    'Sales'

                    AND

                    u.status =
                    'Aktif'

                ORDER BY
                    u.full_name ASC
                "
            )
            ->fetchAll(
                PDO::FETCH_ASSOC
            );


    // =====================================================
    // PRICE PLANS
    // =====================================================

    $plans =
        $pdo
            ->query(
                "
                SELECT

                    id,
                    product,
                    price_plan,
                    price

                FROM price_plans

                ORDER BY

                    product ASC,
                    price ASC,
                    price_plan ASC
                "
            )
            ->fetchAll(
                PDO::FETCH_ASSOC
            );


    // =====================================================
    // TRANSACTIONS
    // =====================================================

    $transactionSql =
        "
        SELECT

            t.id,

            t.user_id
            AS sales_id,

            u.full_name
            AS sales_name,

            u.username,

            u.sales_type,

            u.channel,

            t.store_id,

            s.store_name,

            t.price_plan_id,

            t.transaction_date,

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
        ";


    $transactionParams =
        [];


    /*
    =========================================================
    SALES HANYA MELIHAT TRANSAKSI MILIK SENDIRI
    =========================================================
    */

    if (
        $role ===
        "Sales"

        &&

        $userId >
        0
    ) {

        $transactionSql .=
            "
            WHERE
                t.user_id = ?
            ";


        $transactionParams[] =
            $userId;

    }


    $transactionSql .=
        "
        ORDER BY

            t.transaction_date DESC,

            t.id DESC
        ";


    $stmt =
        $pdo->prepare(
            $transactionSql
        );


    $stmt->execute(
        $transactionParams
    );


    $transactions =
        $stmt->fetchAll(
            PDO::FETCH_ASSOC
        );


    // =====================================================
    // VISITORS
    // =====================================================

    $visitors =
        $pdo
            ->query(
                "
                SELECT

                    v.id,
                    v.visitor_date,
                    v.store_id,

                    s.store_name,

                    v.visitor_count

                FROM visitors v

                INNER JOIN stores s
                    ON s.id =
                    v.store_id

                ORDER BY

                    v.visitor_date DESC,

                    v.id DESC
                "
            )
            ->fetchAll(
                PDO::FETCH_ASSOC
            );


    // =====================================================
    // TARGETS
    // TARGET BULANAN PER SALES
    // =====================================================

    $targets =
        $pdo
            ->query(
                "
                SELECT

                    t.id,
                    t.period,
                    t.sales_id,

                    u.full_name
                    AS sales_name,

                    t.product,
                    t.target_qty

                FROM targets t

                INNER JOIN users u
                    ON u.id =
                    t.sales_id

                ORDER BY

                    t.period DESC,

                    u.full_name ASC
                "
            )
            ->fetchAll(
                PDO::FETCH_ASSOC
            );


    // =====================================================
    // DAILY TARGETS
    // =====================================================
    /*
    Kalau tabel daily_targets sudah dibuat,
    data akan dibaca.

    Kalau tabel belum ada,
    API tetap jalan dan mengembalikan [].
    */

    try {

        $dailyTargets =
            $pdo
                ->query(
                    "
                    SELECT

                        id,
                        target_date,
                        product,
                        daily_target

                    FROM daily_targets

                    ORDER BY

                        target_date ASC,

                        product ASC
                    "
                )
                ->fetchAll(
                    PDO::FETCH_ASSOC
                );

    } catch (
        Throwable $dailyTargetError
    ) {

        $dailyTargets =
            [];

    }


    // =====================================================
    // SALES RANKING
    // SEMUA SALES
    // =====================================================
    /*
    Ranking TIDAK memakai $transactions
    karena pada akun Sales,
    $transactions hanya berisi transaksi Sales itu sendiri.

    Ranking harus mengambil seluruh transaksi dari database
    agar posisi Sales dibandingkan dengan semua Sales.
    */

    $rankingSql =
        "
        SELECT

            u.id
            AS sales_id,

            u.full_name
            AS sales_name,

            s.store_name,

            COALESCE(
                SUM(
                    t.quantity
                ),
                0
            )
            AS total_sales,

            COALESCE(
                SUM(
                    t.price *
                    t.quantity
                ),
                0
            )
            AS total_revenue

        FROM users u

        LEFT JOIN stores s
            ON s.id =
            u.default_store_id

        LEFT JOIN transactions t
            ON t.user_id =
            u.id

        WHERE

            u.role =
            'Sales'

            AND

            u.status =
            'Aktif'

        GROUP BY

            u.id,
            u.full_name,
            s.store_name

        ORDER BY

            total_sales DESC,

            total_revenue DESC,

            u.full_name ASC
        ";


    $rankingRows =
        $pdo
            ->query(
                $rankingSql
            )
            ->fetchAll(
                PDO::FETCH_ASSOC
            );


    /*
    Tambahkan rank 1,2,3,...
    */

    $rank =
        1;


    foreach (
        $rankingRows
        as $row
    ) {

        $salesRanking[] =
            [

                "rank" =>
                    $rank,

                "sales_id" =>
                    (int)$row[
                        "sales_id"
                    ],

                "sales_name" =>
                    $row[
                        "sales_name"
                    ],

                "store_name" =>
                    $row[
                        "store_name"
                    ],

                "total_sales" =>
                    (int)$row[
                        "total_sales"
                    ],

                "total_revenue" =>
                    (float)$row[
                        "total_revenue"
                    ]

            ];


        $rank++;

    }


    // =====================================================
    // NORMALIZE IDs
    // =====================================================

    foreach (
        $stores
        as &$store
    ) {

        $store["id"] =
            (int)$store["id"];

    }

    unset(
        $store
    );


    foreach (
        $sales
        as &$salesItem
    ) {

        $salesItem["id"] =
            (int)$salesItem["id"];


        $salesItem[
            "default_store_id"
        ] =
            $salesItem[
                "default_store_id"
            ] !==
            null

                ? (int)$salesItem[
                    "default_store_id"
                ]

                : null;

    }

    unset(
        $salesItem
    );


    foreach (
        $plans
        as &$plan
    ) {

        $plan["id"] =
            (int)$plan["id"];


        $plan["price"] =
            (float)$plan["price"];

    }

    unset(
        $plan
    );


    // =====================================================
    // RESPONSE
    // =====================================================

    respond(
        [

            "success" =>
                true,

            "role" =>
                $role,

            "stores" =>
                $stores,

            "sales" =>
                $sales,

            "plans" =>
                $plans,

            "transactions" =>
                $transactions,

            "visitors" =>
                $visitors,

            "targets" =>
                $targets,

            "daily_targets" =>
                $dailyTargets,

            "sales_ranking" =>
                $salesRanking

        ]
    );


} catch (
    Throwable $error
) {

    respond(
        [

            "success" =>
                false,

            "message" =>
                $error->getMessage()

        ],
        500
    );

}
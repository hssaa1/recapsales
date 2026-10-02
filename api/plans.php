<?php

session_start();

header(
    "Content-Type: application/json; charset=utf-8"
);

require __DIR__ . "/db.php";


if (
    (
        $_SESSION["role"]
        ??
        ""
    )
    !==
    "Admin"
) {

    http_response_code(
        403
    );


    echo json_encode(
        [

            "success" =>
                false,

            "message" =>
                "Akses ditolak."

        ]
    );


    exit;

}


$method =
    $_SERVER[
        "REQUEST_METHOD"
    ];


$data =
    json_decode(
        file_get_contents(
            "php://input"
        ),
        true
    )
    ??
    [];


try {

    /* =====================================================
       DELETE
    ===================================================== */

    if (
        $method ===
        "DELETE"
    ) {

        /* ALL */

        if (
            (
                $_GET["all"]
                ??
                ""
            )
            ===
            "1"
        ) {

            $stmt =
                $pdo
                    ->prepare(
                        "
                            DELETE p
                            FROM price_plans p

                            LEFT JOIN transactions t

                                ON t.price_plan_id =
                                p.id

                            WHERE
                                t.id IS NULL
                        "
                    );


            $stmt->execute();


            echo json_encode(
                [

                    "success" =>
                        true,

                    "message" =>
                        $stmt
                            ->rowCount()
                        .
                        " Price Plan berhasil dihapus."

                ]
            );


            exit;

        }


        $id =
            (int)
            (
                $_GET["id"]
                ??
                0
            );


        if (!$id) {

            throw new Exception(
                "ID Price Plan tidak valid."
            );

        }


        $stmt =
            $pdo
                ->prepare(
                    "
                        DELETE FROM price_plans

                        WHERE id = ?
                    "
                );


        $stmt->execute(
            [
                $id
            ]
        );


        echo json_encode(
            [
                "success" =>
                    true
            ]
        );


        exit;

    }


    /* =====================================================
       DATA
    ===================================================== */

    $id =
        (int)
        (
            $data["id"]
            ??
            0
        );


    $product =
        trim(
            $data[
                "product"
            ]
            ??
            ""
        );


    $name =
        trim(
            $data[
                "price_plan"
            ]
            ??
            ""
        );


    $price =
        (float)
        (
            $data["price"]
            ??
            0
        );


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

        throw new Exception(
            "Produk tidak valid."
        );

    }


    if (
        $name ===
        ""
    ) {

        throw new Exception(
            "Nama Price Plan wajib diisi."
        );

    }


    if (
        $price <
        0
    ) {

        throw new Exception(
            "Harga tidak valid."
        );

    }


    /* =====================================================
       UPDATE
    ===================================================== */

    if (
        $method ===
        "PUT"
    ) {

        if (!$id) {

            throw new Exception(
                "ID Price Plan tidak valid."
            );

        }


        $stmt =
            $pdo
                ->prepare(
                    "
                        UPDATE price_plans

                        SET

                            product = ?,

                            price_plan = ?,

                            price = ?

                        WHERE
                            id = ?
                    "
                );


        $stmt->execute(
            [

                $product,

                $name,

                $price,

                $id

            ]
        );


    /* =====================================================
       INSERT
    ===================================================== */

    } elseif (
        $method ===
        "POST"
    ) {

        $stmt =
            $pdo
                ->prepare(
                    "
                        INSERT INTO price_plans
                        (
                            product,

                            price_plan,

                            price
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            ?
                        )
                    "
                );


        $stmt->execute(
            [

                $product,

                $name,

                $price

            ]
        );


    } else {

        http_response_code(
            405
        );


        throw new Exception(
            "Method tidak didukung."
        );

    }


    echo json_encode(
        [
            "success" =>
                true
        ]
    );


} catch (
    PDOException $error
) {

    http_response_code(
        400
    );


    echo json_encode(
        [

            "success" =>
                false,

            "message" =>

                $error
                    ->getCode()
                ===
                "23000"

                    ? "Price Plan masih dipakai transaksi atau terjadi konflik data."

                    : $error
                        ->getMessage()

        ]
    );


} catch (
    Throwable $error
) {

    http_response_code(
        400
    );


    echo json_encode(
        [

            "success" =>
                false,

            "message" =>
                $error
                    ->getMessage()

        ]
    );

}
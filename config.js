// js/config.js

const UI_TEXT = {

    "role-eyebrow":
        "Sales Performance Dashboard",

    "role-title":
        "Recap Penjualan XL",

    "role-description":
        "Dashboard untuk mencatat dan memantau performa penjualan XL.",

    "admin-role-title":
        "Admin",

    "admin-role-description":
        "Kelola transaksi, master data, visitor, target dan seluruh data penjualan.",

    "admin-role-cta":
        "Masuk sebagai Admin →",

    "sales-role-title":
        "Sales",

    "sales-role-description":
        "Input transaksi dan pantau hasil penjualan.",

    "sales-role-cta":
        "Masuk sebagai Sales →",

    "role-note":
        "Pilih peran untuk melanjutkan.",

    "brand-name":
        "XL Sales",

    "brand-subtitle":
        "Performance Dashboard",

    "nav-dashboard":
        "Dashboard",

    "nav-input":
        "Input Penjualan",

    "nav-recap":
        "Recap Penjualan",

    "nav-target":
        "Target",

    "nav-visitor":
        "Visitor",

    "nav-master":
        "Master Data",

    "active-role-label":
        "Peran aktif",

    "dashboard-intro":
        "Ringkasan performa penjualan dan aktivitas store.",

    "metric-transactions-label":
        "Total Transaksi",

    "metric-prioritas-label":
        "XL Prioritas",

    "metric-home-label":
        "XLHome",

    "metric-visitors-label":
        "Total Visitor",

    "metric-revenue-prioritas-label":
        "Revenue XL Prioritas",

    "metric-revenue-home-label":
        "Revenue XLHome",

    "visitor-compare-title":
        "Visitor vs Transaksi",

    "visitor-compare-description":
        "Perbandingan jumlah visitor dan transaksi setiap store.",

    "visitor-compare-empty":
        "Belum ada data visitor.",

    "channel-title":
        "Channel Penjualan",

    "instore-label":
        "Instore",

    "outstore-label":
        "Outstore",

    "top-sales-title":
        "Top Sales",

    "top-sales-subtitle":
        "Ranking berdasarkan revenue.",

    "top-sales-prioritas-title":
        "XL Prioritas",

    "top-sales-prioritas-empty":
        "Belum ada transaksi.",

    "top-sales-home-title":
        "XLHome",

    "top-sales-home-empty":
        "Belum ada transaksi.",

    "sales-form-title":
        "Input Penjualan",

    "sales-form-description":
        "Masukkan transaksi penjualan baru.",

    "label-date":
        "Tanggal",

    "label-sales":
        "Sales",

    "label-store":
        "Store",

    "label-channel":
        "Channel",

    "label-product":
        "Produk",

    "label-plan":
        "Price Plan",

    "label-price":
        "Harga",

    "label-quantity":
        "Quantity",

    "label-transaction-type":
        "Tipe Transaksi",

    "label-notes":
        "MSISDN / Catatan",

    "transaction-total-label":
        "Total",

    "save-transaction-button":
        "Simpan Transaksi",

    "filter-title":
        "Filter Recap",

    "filter-description":
        "Filter data transaksi sesuai kebutuhan.",

    "export-button-label":
        "Export Excel",

    "recap-count-label":
        "Jumlah Transaksi",

    "recap-revenue-label":
        "Total Revenue",

    "th-date":
        "Tanggal",

    "th-sales":
        "Sales",

    "th-store":
        "Store",

    "th-product":
        "Produk",

    "th-channel":
        "Channel",

    "th-plan":
        "Price Plan",

    "th-qty":
        "Qty",

    "th-revenue":
        "Revenue",

    "th-actions":
        "Aksi",

    "recap-empty":
        "Belum ada transaksi.",

    "visitor-page-title":
        "Input Visitor",

    "save-visitor-page-button":
        "Simpan Visitor",

    "visitor-history-title":
        "Riwayat Visitor",

    "visitor-history-empty":
        "Belum ada visitor.",

    "visitor-daily-summary-title":
        "Rekap Visitor Harian",

    "visitor-daily-summary-empty":
        "Belum ada data.",

    "target-title":
        "Input Target",

    "save-target-button":
        "Simpan Target",

    "achievement-title":
        "Target & Achievement",

    "walkin-label":
        "Walk-in",

    "walkout-label":
        "Walk-out",

    "master-locked-title":
        "Master Data",

    "master-locked-description":
        "Masukkan PIN Admin untuk membuka Master Data.",

    "store-title":
        "Master Store",

    "save-store-button":
        "Tambah Store",

    "sales-master-title":
        "Master Sales",

    "save-sales-button":
        "Tambah Sales",

    "plan-master-title":
        "Master Price Plan",

    "save-plan-button":
        "Tambah Price Plan",

    "clear-all-data-title":
        "Hapus Data Master",

    "clear-store-data-button":
        "Hapus Store",

    "clear-sales-data-button":
        "Hapus Sales",

    "clear-plan-data-button":
        "Hapus Price Plan",

    "master-access-title":
        "Akses Master Data",

    "master-access-description":
        "Masukkan PIN Admin.",

    "master-access-cancel":
        "Batal",

    "master-access-submit":
        "Masuk"
};


document.addEventListener(
    "DOMContentLoaded",
    function () {

        Object.entries(
            UI_TEXT
        ).forEach(
            function ([id, text]) {

                const element =
                    document.querySelector(
                        `[data-template-id="${id}"]`
                    );

                if (element) {

                    element.textContent =
                        text;

                }

            }
        );

    }
);
console.log("XL SALES DATABASE FINAL SYNC 2026-10-02");

document.addEventListener("DOMContentLoaded", async () => {

    // =========================================================
    // DOM
    // =========================================================

    const $ = id => document.getElementById(id);

    // =========================================================
    // STATE
    // =========================================================

    const state = {
        role: "",
        user: null,
        selectedRole: "",
        currentView: "dashboard",
        stores: [],
        sales: [],
        plans: [],
        transactions: [],
        visitors: [],
        targets: [],
        dailyTargets: [],
        salesRanking: []
    };

    // =========================================================
    // DATE
    // =========================================================

    function localDate() {
        const d = new Date();

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");
    }

    let today = localDate();
    let currentMonth = today.slice(0, 7);

    // =========================================================
    // CHART
    // =========================================================

    let adminPrioritasChart = null;
    let adminHomeChart = null;
    let visitorTransactionChart = null;
    let salesProgressChart = null;
    let salesCategoryChart = null;

    // =========================================================
    // BASIC FUNCTIONS
    // =========================================================

    function money(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getValue(id) {
        return $(id)?.value ?? "";
    }

    function setValue(id, value) {
        const el = $(id);

        if (el) {
            el.value = value ?? "";
        }
    }

    function setText(id, value) {
        const el = $(id);

        if (el) {
            el.textContent = value ?? "";
        }
    }

    function setDisabled(id, value) {
        const el = $(id);

        if (el) {
            el.disabled = value;
        }
    }

    function totalQuantity(rows) {
        return rows.reduce(
            (sum, row) =>
                sum + (Number(row.quantity) || 0),
            0
        );
    }

    function totalRevenue(rows) {
        return rows.reduce(
            (sum, row) =>
                sum +
                (Number(row.price) || 0) *
                (Number(row.quantity) || 0),
            0
        );
    }

    function formatChartDate(value) {
        const parts = String(value || "").split("-");

        if (parts.length !== 3) {
            return value;
        }

        return `${parts[2]}/${parts[1]}`;
    }

    function toast(message) {
        const el = $("toast");

        if (!el) {
            console.log(message);
            return;
        }

        el.textContent = message;
        el.classList.add("show");

        clearTimeout(window.__toastTimer);

        window.__toastTimer = setTimeout(() => {
            el.classList.remove("show");
        }, 2600);
    }

    // =========================================================
    // API
    // =========================================================

    async function api(url, options = {}) {

        const config = {
            method: options.method || "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                Accept: "application/json"
            }
        };

        if (options.body !== undefined) {
            config.headers["Content-Type"] =
                "application/json";

            config.body =
                JSON.stringify(options.body);
        }

        let response;

        try {
            response = await fetch(url, config);
        } catch (error) {
            console.error(error);

            throw new Error(
                "Tidak dapat terhubung ke server."
            );
        }

        let result;

        try {
            result = await response.json();
        } catch (error) {
            console.error(error);

            throw new Error(
                "Response API bukan JSON."
            );
        }

        if (
            !response.ok ||
            result?.success === false
        ) {
            throw new Error(
                result?.message ||
                `Server Error ${response.status}`
            );
        }

        return result;
    }

    // =========================================================
    // SELECT HELPER
    // =========================================================

    function fillSelect(
        id,
        rows,
        placeholder,
        valueGetter,
        labelGetter
    ) {

        const select = $(id);

        if (!select) {
            return;
        }

        const previous = String(
            select.value || ""
        );

        select.innerHTML = `
            <option value="">
                ${esc(placeholder)}
            </option>
        `;

        rows.forEach(row => {
            const option =
                document.createElement("option");

            option.value =
                String(valueGetter(row) ?? "");

            option.textContent =
                labelGetter(row);

            select.appendChild(option);
        });

        const exists =
            [...select.options].some(
                option =>
                    option.value === previous
            );

        if (exists) {
            select.value = previous;
        }
    }

    // =========================================================
    // LOAD DATABASE
    // =========================================================

    async function loadData() {

        const result =
            await api("./api/bootstrap.php");

        state.stores =
            Array.isArray(result.stores)
                ? result.stores
                : [];

        state.sales =
            Array.isArray(result.sales)
                ? result.sales
                : [];

        state.plans =
            Array.isArray(result.plans)
                ? result.plans
                : [];

        state.transactions =
            Array.isArray(result.transactions)
                ? result.transactions
                : [];

        state.visitors =
            Array.isArray(result.visitors)
                ? result.visitors
                : [];

        state.targets =
            Array.isArray(result.targets)
                ? result.targets
                : [];

        state.dailyTargets =
            Array.isArray(result.daily_targets)
                ? result.daily_targets
                : [];

        state.salesRanking =
            Array.isArray(result.sales_ranking)
                ? result.sales_ranking
                : [];

        console.log("DATABASE:", {
            stores: state.stores.length,
            sales: state.sales.length,
            plans: state.plans.length,
            transactions: state.transactions.length,
            visitors: state.visitors.length,
            targets: state.targets.length
        });

        if (state.role) {
            syncOptions();
            renderDashboard();
            renderRecap();
            renderTargets();
            renderVisitor();
            renderMaster();
        }
    }

    // =========================================================
    // LANDING PAGE
    // =========================================================

    function showLanding() {

        document.body.classList.remove(
            "logged-in"
        );

        $("login-screen")
            ?.classList.remove("active");

        $("app-screen")
            ?.classList.remove("active");

        $("role-screen")
            ?.classList.remove("active");

        $("landing-screen")
            ?.classList.add("active");
    }

    // =========================================================
    // LOGIN SCREEN
    // =========================================================

    function openLogin(role) {

        state.selectedRole = role;

        $("landing-screen")
            ?.classList.remove("active");

        $("role-screen")
            ?.classList.remove("active");

        $("app-screen")
            ?.classList.remove("active");

        $("login-screen")
            ?.classList.add("active");

        $("login-form")
            ?.reset();

        setText(
            "login-status",
            ""
        );

        if ($("login-password")) {
            $("login-password").type =
                "password";
        }

        setText(
            "toggle-password",
            "Lihat"
        );

        setText(
            "login-title",
            `Login ${role}`
        );

        setText(
            "login-role-chip",
            `${role} Access`
        );

        setText(
            "login-description",
            role === "Admin"
                ? "Masukkan akun Administrator."
                : "Masukkan akun Sales."
        );

        if ($("login-avatar")) {
            $("login-avatar").textContent =
                role === "Admin"
                    ? "A"
                    : "S";
        }
    }

    // =========================================================
    // LANDING LOGIN
    // =========================================================

    $("landing-login-admin")
        ?.addEventListener(
            "click",
            () => openLogin("Admin")
        );

    $("landing-login-sales")
        ?.addEventListener(
            "click",
            () => openLogin("Sales")
        );

    $("hero-login-admin")
        ?.addEventListener(
            "click",
            () => openLogin("Admin")
        );

    $("hero-login-sales")
        ?.addEventListener(
            "click",
            () => openLogin("Sales")
        );

    // ID VERSI LAMA

    $("public-login-admin")
        ?.addEventListener(
            "click",
            () => openLogin("Admin")
        );

    $("public-login-sales")
        ?.addEventListener(
            "click",
            () => openLogin("Sales")
        );

    $("choose-admin")
        ?.addEventListener(
            "click",
            () => openLogin("Admin")
        );

    $("choose-sales")
        ?.addEventListener(
            "click",
            () => openLogin("Sales")
        );

    // =========================================================
    // BACK
    // =========================================================

    $("back-to-landing")
        ?.addEventListener(
            "click",
            showLanding
        );

    $("back-to-dashboard")
        ?.addEventListener(
            "click",
            showLanding
        );

    $("back-to-role")
        ?.addEventListener(
            "click",
            showLanding
        );

    // =========================================================
    // PASSWORD
    // =========================================================

    $("toggle-password")
        ?.addEventListener(
            "click",
            () => {

                const input =
                    $("login-password");

                if (!input) {
                    return;
                }

                const hidden =
                    input.type === "password";

                input.type =
                    hidden
                        ? "text"
                        : "password";

                setText(
                    "toggle-password",
                    hidden
                        ? "Sembunyikan"
                        : "Lihat"
                );
            }
        );

    // =========================================================
    // LOGIN
    // =========================================================

    $("login-form")
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const username =
                    getValue(
                        "login-username"
                    ).trim();

                const password =
                    getValue(
                        "login-password"
                    );

                if (
                    !username ||
                    !password
                ) {
                    setText(
                        "login-status",
                        "Username dan password wajib diisi."
                    );

                    return;
                }

                try {

                    setText(
                        "login-status",
                        "Memeriksa akun..."
                    );

                    const result =
                        await api(
                            "./api/login.php",
                            {
                                method: "POST",
                                body: {
                                    username,
                                    password
                                }
                            }
                        );

                    if (
                        !result.user ||
                        result.logged_in === false
                    ) {
                        throw new Error(
                            "Session login gagal dibuat."
                        );
                    }

                    if (
                        state.selectedRole &&
                        result.user.role !==
                            state.selectedRole
                    ) {

                        try {
                            await api(
                                "./api/logout.php",
                                {
                                    method: "POST",
                                    body: {}
                                }
                            );
                        } catch (e) {
                            console.warn(e);
                        }

                        throw new Error(
                            `Akun ini merupakan akun ${result.user.role}.`
                        );
                    }

                    state.user =
                        result.user;

                    state.role =
                        result.user.role;

                    state.selectedRole =
                        result.user.role;

                    setText(
                        "login-status",
                        ""
                    );

                    await startApplication();

                } catch (error) {

                    console.error(
                        "LOGIN ERROR:",
                        error
                    );

                    setText(
                        "login-status",
                        error.message
                    );
                }
            }
        );

// =========================================================
// START INTERNAL APP
// =========================================================

async function startApplication() {

    if (
        !state.user ||
        !state.role
    ) {
        showLanding();
        return;
    }

    $("landing-screen")
        ?.classList.remove("active");

    $("role-screen")
        ?.classList.remove("active");

    $("login-screen")
        ?.classList.remove("active");

    $("app-screen")
        ?.classList.add("active");

    document.body.classList.add(
        "logged-in"
    );

    // ROLE MENU

    document
        .querySelectorAll(
            ".admin-only"
        )
        .forEach(element => {

            element.classList.toggle(
                "hidden",
                state.role !== "Admin"
            );
        });

    document
        .querySelectorAll(
            ".admin-dashboard-only"
        )
        .forEach(element => {

            element.classList.toggle(
                "hidden",
                state.role !== "Admin"
            );
        });

    document
        .querySelectorAll(
            ".sales-dashboard-only"
        )
        .forEach(element => {

            element.classList.toggle(
                "hidden",
                state.role !== "Sales"
            );
        });

    setText(
        "active-role",
        state.user.full_name ||
        state.role
    );

    setText(
        "header-role",
        state.role
    );

    /*
    LOAD DATABASE SETELAH SESSION USER ADA.
    */

    await loadData();

    if (
        state.role === "Sales"
    ) {

        applySalesIdentity();

        if ($("filter-sales")) {

            $("filter-sales").value =
                String(
                    state.user.id
                );

            $("filter-sales").disabled =
                true;
        }

    } else {

        enableAdminTransaction();

        if ($("filter-sales")) {

            $("filter-sales").disabled =
                false;
        }
    }

    showView("dashboard");
}


// =========================================================
// LOGOUT
// =========================================================

$("logout-button")
    ?.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            const button =
                $("logout-button");

            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Logout...";
            }

            try {

                await api(
                    "./api/logout.php",
                    {
                        method:
                            "POST",

                        body: {}
                    }
                );

                state.role = "";

                state.user =
                    null;

                state.selectedRole =
                    "";

                state.currentView =
                    "dashboard";

                state.transactions =
                    [];

                state.visitors =
                    [];

                state.targets =
                    [];

                state.dailyTargets =
                    [];

                state.salesRanking =
                    [];

                showLanding();

                toast(
                    "Logout berhasil."
                );

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                toast(
                    "Logout gagal: " +
                    error.message
                );

            } finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "Logout";
                }
            }
        }
    );


// =========================================================
// NAVIGATION
// =========================================================

const pageInfo = {

    dashboard: {

        kicker:
            "Ringkasan performa",

        title:
            "Dashboard Penjualan"
    },

    input: {

        kicker:
            "Pencatatan transaksi",

        title:
            "Input Penjualan"
    },

    recap: {

        kicker:
            "Data transaksi",

        title:
            "Recap Penjualan"
    },

    target: {

        kicker:
            "Kinerja Sales",

        title:
            "Target & Achievement"
    },

    visitor: {

        kicker:
            "Traffic Store",

        title:
            "Input Visitor"
    },

    master: {

        kicker:
            "Administration",

        title:
            "Master Data"
    }
};


function showView(view) {

    if (
        state.role === "Sales" &&
        [
            "target",
            "visitor",
            "master"
        ].includes(view)
    ) {

        view =
            "dashboard";
    }

    state.currentView =
        view;

    document
        .querySelectorAll(
            ".view"
        )
        .forEach(
            element => {

                element.classList.toggle(
                    "active",

                    element.id ===
                        `view-${view}`
                );
            }
        );

    document
        .querySelectorAll(
            "[data-view]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",

                    button.dataset.view ===
                        view
                );
            }
        );

    const info =
        pageInfo[
            view
        ];

    if (info) {

        setText(
            "page-kicker",
            info.kicker
        );

        setText(
            "page-title",
            info.title
        );
    }

    if (
        view ===
        "dashboard"
    ) {

        renderDashboard();
    }

    if (
        view ===
        "input"
    ) {

        syncOptions();

        if (
            state.role ===
            "Sales"
        ) {

            applySalesIdentity();

        } else {

            enableAdminTransaction();
        }
    }

    if (
        view ===
        "recap"
    ) {

        renderRecap();
    }

    if (
        view ===
        "target"
    ) {

        renderTargets();
    }

    if (
        view ===
        "visitor"
    ) {

        renderVisitor();
    }

    if (
        view ===
        "master"
    ) {

        renderMaster();
    }
}


document
    .querySelectorAll(
        "[data-view]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showView(
                        button.dataset.view
                    );
                }
            );
        }
    );


// =========================================================
// SYNC SELECT
// =========================================================

function syncOptions() {

    if (
        state.role !==
        "Sales"
    ) {

        fillSelect(
            "transaction-sales",
            state.sales,
            "Pilih Sales",
            item => item.id,
            item => item.full_name
        );
    }

    fillSelect(
        "filter-sales",
        state.sales,
        "Semua Sales",
        item => item.id,
        item => item.full_name
    );

    fillSelect(
        "filter-store",
        state.stores,
        "Semua Store",
        item => item.id,
        item => item.store_name
    );

    fillSelect(
        "visitor-store",
        state.stores,
        "Pilih Store",
        item => item.id,
        item => item.store_name
    );

    fillSelect(
        "sales-store",
        state.stores,
        "Pilih Store",
        item => item.id,
        item => item.store_name
    );

    syncPlans(
        true
    );
}


// =========================================================
// STORE OPTIONS
// =========================================================

function setStoreOptions(
    selectedId = ""
) {

    const select =
        $("transaction-store");

    if (!select) {

        return;
    }

    select.innerHTML = `
        <option value="">
            Pilih Store
        </option>
    `;

    state.stores
        .forEach(
            store => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    String(
                        store.id
                    );

                option.textContent =
                    store.store_name;

                select.appendChild(
                    option
                );
            }
        );

    if (
        selectedId !== "" &&
        selectedId !== null &&
        selectedId !== undefined
    ) {

        select.value =
            String(
                selectedId
            );
    }
}


// =========================================================
// PRICE PLAN
// =========================================================

function syncPlans(
    keepSelected = false
) {

    const productSelect =
        $("transaction-product");

    const planSelect =
        $("transaction-plan");

    const priceInput =
        $("transaction-price");

    if (
        !productSelect ||
        !planSelect
    ) {

        return;
    }

    const product =
        productSelect.value;

    const previous =
        keepSelected
            ? planSelect.value
            : "";

    /*
    Product belum dipilih:
    semua Price Plan internal tetap tampil.
    */

    let plans =
        [
            ...state.plans
        ];

    if (product) {

        plans =
            state.plans.filter(
                plan =>
                    String(
                        plan.product ||
                        ""
                    )
                        .trim()
                        .toLowerCase()
                    ===
                    String(
                        product
                    )
                        .trim()
                        .toLowerCase()
            );
    }

    planSelect.innerHTML = `
        <option value="">
            Pilih Price Plan
        </option>
    `;

    plans.forEach(
        plan => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(
                    plan.id
                );

            option.textContent =
                `${plan.price_plan} — ${money(
                    plan.price
                )}`;

            option.dataset.price =
                String(
                    plan.price
                );

            option.dataset.product =
                String(
                    plan.product
                );

            option.dataset.planName =
                String(
                    plan.price_plan
                );

            planSelect.appendChild(
                option
            );
        }
    );

    if (
        previous &&
        [
            ...planSelect.options
        ].some(
            option =>
                option.value ===
                previous
        )
    ) {

        planSelect.value =
            previous;
    }

    if (
        !keepSelected &&
        priceInput
    ) {

        priceInput.value =
            "";
    }

    calculateTotal();
}

// =========================================================
// PRODUCT CHANGE
// =========================================================

$("transaction-product")
    ?.addEventListener(
        "change",
        () => {

            syncPlans(false);
        }
    );

// =========================================================
// PLAN CHANGE
// =========================================================

$("transaction-plan")
    ?.addEventListener(
        "change",
        function () {

            const option =
                this.selectedOptions[0];

            if (
                !option ||
                !option.value
            ) {
                setValue(
                    "transaction-price",
                    ""
                );

                calculateTotal();

                return;
            }

            /*
            HARGA OTOMATIS,
            tetapi input Harga tetap editable.
            */

            setValue(
                "transaction-price",
                option.dataset.price || ""
            );

            /*
            Plan dipilih lebih dulu:
            Product otomatis.
            */

            if (
                !getValue(
                    "transaction-product"
                ) &&
                option.dataset.product
            ) {
                setValue(
                    "transaction-product",
                    option.dataset.product
                );
            }

            calculateTotal();
        }
    );

// =========================================================
// TOTAL
// =========================================================

function calculateTotal() {

    const price =
        Number(
            getValue(
                "transaction-price"
            )
        ) || 0;

    const qty =
        Number(
            getValue(
                "transaction-quantity"
            )
        ) || 0;

    setText(
        "transaction-total",
        money(price * qty)
    );
}

$("transaction-price")
    ?.addEventListener(
        "input",
        calculateTotal
    );

$("transaction-quantity")
    ?.addEventListener(
        "input",
        calculateTotal
    );

// =========================================================
// SALES INPUT IDENTITY
// =========================================================

function applySalesIdentity() {

    if (
        state.role !== "Sales" ||
        !state.user
    ) {
        return;
    }

    /*
    Sales otomatis dari akun.
    Tidak bisa diganti.
    */

    $("admin-sales-field")
        ?.classList.add("hidden");

    $("sales-identity-field")
        ?.classList.remove("hidden");

    setValue(
        "transaction-sales-name",
        state.user.full_name || ""
    );

    /*
    Store otomatis sesuai akun,
    TETAPI dropdown tetap aktif.
    */

    setStoreOptions(
        state.user.default_store_id ||
        ""
    );

    setDisabled(
        "transaction-store",
        false
    );

    /*
    Channel otomatis + terkunci.
    */

    const channel =
        state.user.channel ||
        (
            state.user.sales_type ===
                "Walk-out"
                ? "Outstore"
                : "Instore"
        );

    if (
        $("transaction-channel")
    ) {
        $("transaction-channel")
            .innerHTML = `
                <option value="${esc(channel)}">
                    ${esc(channel)}
                </option>
            `;

        $("transaction-channel").value =
            channel;

        $("transaction-channel").disabled =
            true;
    }

    syncPlans(true);
}

// =========================================================
// ADMIN INPUT IDENTITY
// =========================================================

function enableAdminTransaction() {

    $("sales-identity-field")
        ?.classList.add("hidden");

    $("admin-sales-field")
        ?.classList.remove("hidden");

    fillSelect(
        "transaction-sales",
        state.sales,
        "Pilih Sales",
        item => item.id,
        item => item.full_name
    );

    setValue(
        "transaction-sales",
        ""
    );

    setStoreOptions();

    setDisabled(
        "transaction-store",
        true
    );

    if (
        $("transaction-channel")
    ) {
        $("transaction-channel")
            .innerHTML = `
                <option value="">
                    Pilih Sales terlebih dahulu
                </option>
            `;

        $("transaction-channel").disabled =
            true;
    }

    syncPlans(true);
}

// =========================================================
// ADMIN SELECT SALES
// =========================================================

$("transaction-sales")
    ?.addEventListener(
        "change",
        function () {

            if (
                state.role !== "Admin"
            ) {
                return;
            }

            const sales =
                state.sales.find(
                    item =>
                        Number(item.id) ===
                        Number(this.value)
                );

            if (!sales) {

                setStoreOptions();

                setDisabled(
                    "transaction-store",
                    true
                );

                if (
                    $("transaction-channel")
                ) {
                    $("transaction-channel")
                        .innerHTML = `
                            <option value="">
                                Pilih Sales terlebih dahulu
                            </option>
                        `;
                }

                return;
            }

            /*
            Store default dari Sales,
            tetapi tetap bisa dipilih lain.
            */

            setStoreOptions(
                sales.default_store_id
            );

            setDisabled(
                "transaction-store",
                false
            );

            const channel =
                sales.channel ||
                (
                    sales.sales_type ===
                        "Walk-out"
                        ? "Outstore"
                        : "Instore"
                );

            if (
                $("transaction-channel")
            ) {
                $("transaction-channel")
                    .innerHTML = `
                        <option value="${esc(channel)}">
                            ${esc(channel)}
                        </option>
                    `;

                $("transaction-channel").value =
                    channel;

                $("transaction-channel").disabled =
                    true;
            }
        }
    );

// =========================================================
// RESET TRANSACTION
// =========================================================

function resetTransactionForm() {

    $("transaction-form")
        ?.reset();

    setValue(
        "transaction-date",
        today
    );

    setValue(
        "transaction-quantity",
        1
    );

    setValue(
        "transaction-product",
        ""
    );

    setValue(
        "transaction-price",
        ""
    );

    setValue(
        "transaction-notes",
        ""
    );

    syncPlans(false);

    calculateTotal();

    if (
        state.role === "Sales"
    ) {
        applySalesIdentity();
    } else {
        enableAdminTransaction();
    }
}

// =========================================================
// SAVE TRANSACTION
// =========================================================

$("transaction-form")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const body = {

                transaction_date:
                    getValue(
                        "transaction-date"
                    ),

                store_id:
                    Number(
                        getValue(
                            "transaction-store"
                        )
                    ),

                product:
                    getValue(
                        "transaction-product"
                    ),

                price_plan_id:
                    Number(
                        getValue(
                            "transaction-plan"
                        )
                    ),

                price:
                    Number(
                        getValue(
                            "transaction-price"
                        )
                    ),

                quantity:
                    Number(
                        getValue(
                            "transaction-quantity"
                        )
                    ),

                transaction_type:
                    getValue(
                        "transaction-type"
                    ),

                notes:
                    getValue(
                        "transaction-notes"
                    ).trim()
            };

            /*
            Sales tidak mengirim sales_id.
            Backend mengambil dari SESSION.
            */

            if (
                state.role === "Admin"
            ) {
                body.sales_id =
                    Number(
                        getValue(
                            "transaction-sales"
                        )
                    );
            }

            if (
                !body.transaction_date ||
                !body.store_id ||
                !body.product ||
                !body.price_plan_id ||
                body.quantity <= 0 ||
                !body.transaction_type ||
                (
                    state.role === "Admin" &&
                    !body.sales_id
                )
            ) {
                toast(
                    "Lengkapi seluruh data transaksi."
                );

                return;
            }

            try {

                await api(
                    "./api/transactions.php",
                    {
                        method: "POST",
                        body
                    }
                );

                /*
                Reload database.
                Recap + Dashboard ikut berubah.
                */

                await loadData();

                resetTransactionForm();

                toast(
                    "Transaksi berhasil disimpan."
                );

            } catch (error) {

                console.error(
                    "TRANSACTION ERROR:",
                    error
                );

                toast(
                    error.message
                );
            }
        }
    );

    // =========================================================
// TARGET DAILY READER
// =========================================================

function getDailyTarget(
    date,
    product
) {

    const exact =
        state.dailyTargets.find(
            item =>
                item.product === product &&
                String(
                    item.target_date
                ) === date
        );

    if (exact) {
        return Number(
            exact.daily_target
        ) || 0;
    }

    const previous =
        state.dailyTargets
            .filter(
                item =>
                    item.product === product &&
                    String(
                        item.target_date
                    ) < date
            )
            .sort(
                (a, b) =>
                    String(
                        b.target_date
                    ).localeCompare(
                        String(
                            a.target_date
                        )
                    )
            )[0];

    return previous
        ? Number(
            previous.daily_target
        ) || 0
        : 0;
}


// =========================================================
// DAILY ACTUAL FROM TRANSACTIONS
// =========================================================

function getDailyActual(
    date,
    product
) {

    return state.transactions
        .filter(
            item =>
                item.product === product &&
                String(
                    item.transaction_date
                ) === date
        )
        .reduce(
            (sum, item) =>
                sum +
                (
                    Number(
                        item.quantity
                    ) || 0
                ),
            0
        );
}


// =========================================================
// TARGET + ACTUAL + GAP + CARRY OVER
// =========================================================

function calculateDailyPerformance(
    product
) {

    const targetDates =
        state.dailyTargets
            .filter(
                item =>
                    item.product === product
            )
            .map(
                item =>
                    String(
                        item.target_date
                    )
            )
            .sort();

    let firstDate =
        targetDates[0];

    /*
    Kalau target harian belum ada,
    actual transaksi tetap bisa tampil.
    */

    if (!firstDate) {

        const transactionDates =
            state.transactions
                .filter(
                    item =>
                        item.product ===
                        product
                )
                .map(
                    item =>
                        String(
                            item.transaction_date
                        )
                )
                .sort();

        firstDate =
            transactionDates[0];
    }

    if (!firstDate) {
        return [];
    }

    const dates = [];

    const cursor =
        new Date(
            `${firstDate}T00:00:00`
        );

    const end =
        new Date(
            `${today}T00:00:00`
        );

    while (
        cursor <= end
    ) {

        const y =
            cursor.getFullYear();

        const m =
            String(
                cursor.getMonth() + 1
            ).padStart(2, "0");

        const d =
            String(
                cursor.getDate()
            ).padStart(2, "0");

        dates.push(
            `${y}-${m}-${d}`
        );

        cursor.setDate(
            cursor.getDate() + 1
        );
    }

    let carry = 0;

    return dates.map(date => {

        const baseTarget =
            getDailyTarget(
                date,
                product
            );

        const carryIn =
            carry;

        const effectiveTarget =
            baseTarget +
            carryIn;

        const actual =
            getDailyActual(
                date,
                product
            );

        const gap =
            Math.max(
                effectiveTarget -
                actual,
                0
            );

        const achievement =
            effectiveTarget > 0
                ? Math.min(
                    actual /
                    effectiveTarget *
                    100,
                    100
                )
                : 0;

        carry = gap;

        return {
            date,
            baseTarget,
            carryIn,
            effectiveTarget,
            actual,
            gap,
            achievement
        };
    });
}


// =========================================================
// DASHBOARD
// =========================================================

function renderDashboard() {

    const prioritas =
        state.transactions.filter(
            item =>
                item.product ===
                "XL Prioritas"
        );

    const home =
        state.transactions.filter(
            item =>
                item.product ===
                "XLHome"
        );

    setText(
        "metric-transactions",
        state.transactions.length
    );

    setText(
        "metric-prioritas",
        totalQuantity(
            prioritas
        )
    );

    setText(
        "metric-home",
        totalQuantity(
            home
        )
    );

    setText(
        "metric-revenue-prioritas",
        money(
            totalRevenue(
                prioritas
            )
        )
    );

    setText(
        "metric-revenue-home",
        money(
            totalRevenue(
                home
            )
        )
    );

    setText(
        "dashboard-period",
        `${state.transactions.length} transaksi tercatat`
    );

    if (
        state.role ===
        "Admin"
    ) {

        const visitors =
            state.visitors.reduce(
                (sum, item) =>
                    sum +
                    (
                        Number(
                            item.visitor_count
                        ) || 0
                    ),
                0
            );

        setText(
            "metric-visitors",
            visitors
        );

        renderAdminDashboard();
    }

    if (
        state.role ===
        "Sales"
    ) {

        renderSalesDashboard();
    }
}


// =========================================================
// ADMIN DASHBOARD
// =========================================================

function renderAdminDashboard() {

    renderProductChart(
        "XL Prioritas",
        [
            "admin-prioritas-chart",
            "prioritas-chart"
        ],
        "prio"
    );

    renderProductChart(
        "XLHome",
        [
            "admin-home-chart",
            "home-chart",
            "xlhome-chart"
        ],
        "home"
    );

    renderVisitorTransactionChart();

    renderChannelBreakdown();

    renderTopSales();
}


// =========================================================
// CANVAS HELPER
// =========================================================

function firstCanvas(ids) {

    for (
        const id of ids
    ) {

        if ($(id)) {
            return $(id);
        }
    }

    return null;
}


// =========================================================
// PRODUCT CHART
// =========================================================

function renderProductChart(
    product,
    canvasIds,
    prefix
) {

    const rows =
        calculateDailyPerformance(
            product
        );

    const current =
        rows.find(
            row =>
                row.date ===
                today
        )
        ||
        rows[
            rows.length - 1
        ]
        ||
        {
            baseTarget: 0,
            carryIn: 0,
            effectiveTarget: 0,
            actual: 0,
            gap: 0,
            achievement: 0
        };


    // =====================================================
    // DASHBOARD IDS
    // =====================================================

    setText(
        `${prefix}-daily-target`,
        current.baseTarget
    );

    setText(
        `${prefix}-carry`,
        current.carryIn
    );

    setText(
        `${prefix}-effective-target`,
        current.effectiveTarget
    );

    setText(
        `${prefix}-today-actual`,
        current.actual
    );

    setText(
        `${prefix}-today-gap`,
        current.gap
    );

    setText(
        `${prefix}-achievement`,
        `${Math.round(
            current.achievement
        )}%`
    );


    // =====================================================
    // SUPPORT ID LAMA
    // =====================================================

    if (
        product ===
        "XL Prioritas"
    ) {

        setText(
            "prioritas-target",
            current.effectiveTarget
        );

        setText(
            "prioritas-actual",
            current.actual
        );

        setText(
            "prioritas-gap",
            current.gap
        );

        setText(
            "prioritas-achievement",
            `${Math.round(
                current.achievement
            )}%`
        );
    }


    if (
        product ===
        "XLHome"
    ) {

        setText(
            "home-target",
            current.effectiveTarget
        );

        setText(
            "home-actual",
            current.actual
        );

        setText(
            "home-gap",
            current.gap
        );

        setText(
            "home-achievement",
            `${Math.round(
                current.achievement
            )}%`
        );

        setText(
            "xlhome-target",
            current.effectiveTarget
        );

        setText(
            "xlhome-actual",
            current.actual
        );

        setText(
            "xlhome-gap",
            current.gap
        );

        setText(
            "xlhome-achievement",
            `${Math.round(
                current.achievement
            )}%`
        );
    }


    // =====================================================
    // STATUS
    // =====================================================

    const status =
        $(
            `${prefix}-today-status`
        );

    if (status) {

        if (
            current.effectiveTarget <= 0
        ) {

            status.textContent =
                "Belum ada target";

            status.className =
                "performance-status";

        } else if (
            current.gap === 0
        ) {

            status.textContent =
                "Target Tercapai";

            status.className =
                "performance-status success";

        } else {

            status.textContent =
                `${current.gap} unit lagi`;

            status.className =
                "performance-status pending";
        }
    }


    // =====================================================
    // CHECK CHART.JS
    // =====================================================

    if (
        typeof Chart ===
        "undefined"
    ) {

        return;
    }

    const canvas =
        firstCanvas(
            canvasIds
        );

    if (!canvas) {
        return;
    }


    // =====================================================
    // DESTROY OLD CHART
    // =====================================================

    if (
        product ===
            "XL Prioritas" &&
        adminPrioritasChart
    ) {

        adminPrioritasChart
            .destroy();
    }

    if (
        product ===
            "XLHome" &&
        adminHomeChart
    ) {

        adminHomeChart
            .destroy();
    }


    // =====================================================
    // COLORS
    // =====================================================

    const primary =
        product ===
        "XL Prioritas"
            ? "#0d72d9"
            : "#07936a";

    const fill =
        product ===
        "XL Prioritas"
            ? "rgba(13,114,217,.12)"
            : "rgba(7,147,106,.12)";


    // =====================================================
    // CREATE CHART
    // =====================================================

    const chart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        rows.map(
                            row =>
                                formatChartDate(
                                    row.date
                                )
                        ),

                    datasets: [

                        {
                            label:
                                "Target",

                            data:
                                rows.map(
                                    row =>
                                        row.effectiveTarget
                                ),

                            borderColor:
                                "#8a99a8",

                            backgroundColor:
                                "transparent",

                            borderWidth:
                                2,

                            borderDash: [
                                6,
                                5
                            ],

                            pointRadius:
                                2,

                            tension:
                                .3
                        },

                        {
                            label:
                                "Actual",

                            data:
                                rows.map(
                                    row =>
                                        row.actual
                                ),

                            borderColor:
                                primary,

                            backgroundColor:
                                fill,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            tension:
                                .35,

                            fill:
                                true
                        },

                        {
                            label:
                                "Gap",

                            data:
                                rows.map(
                                    row =>
                                        row.gap
                                ),

                            borderColor:
                                "#ed8b00",

                            backgroundColor:
                                "transparent",

                            borderWidth:
                                2,

                            pointRadius:
                                3,

                            tension:
                                .3
                        }

                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false
                    },

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                usePointStyle:
                                    true,

                                boxWidth:
                                    7,

                                padding:
                                    12,

                                font: {
                                    size: 9
                                }
                            }
                        },

                        tooltip: {

                            callbacks: {

                                afterBody:
                                    context => {

                                        const index =
                                            context[0]
                                                .dataIndex;

                                        const row =
                                            rows[
                                                index
                                            ];

                                        if (!row) {

                                            return [];
                                        }

                                        return [

                                            `Target dasar: ${row.baseTarget}`,

                                            `Carry-over: ${row.carryIn}`,

                                            `Achievement: ${Math.round(
                                                row.achievement
                                            )}%`
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        x: {

                            grid: {
                                display:
                                    false
                            }
                        },

                        y: {

                            beginAtZero:
                                true,

                            ticks: {
                                precision:
                                    0
                            }
                        }
                    }
                }
            }
        );


    if (
        product ===
        "XL Prioritas"
    ) {

        adminPrioritasChart =
            chart;

    } else {

        adminHomeChart =
            chart;
    }
}


// =========================================================
// ACTIVE DAILY TARGET
// =========================================================

function getActiveDailyTarget(
    product
) {

    const rows =
        state.dailyTargets
            .filter(
                item =>
                    item.product ===
                        product
                    &&
                    String(
                        item.target_date
                    ) <= today
            )
            .sort(
                (a, b) =>
                    String(
                        b.target_date
                    ).localeCompare(
                        String(
                            a.target_date
                        )
                    )
            );

    return rows[0]
        ? Number(
            rows[0].daily_target
        ) || 0
        : 0;
}


// =========================================================
// RENDER DAILY TARGET PAGE
// =========================================================

function renderDailyTargets() {

    const prioritas =
        getActiveDailyTarget(
            "XL Prioritas"
        );

    const home =
        getActiveDailyTarget(
            "XLHome"
        );

    setText(
        "active-target-prioritas",
        prioritas
    );

    setText(
        "active-target-home",
        home
    );

    const container =
        $("daily-target-history");

    if (!container) {
        return;
    }

    const rows =
        [
            ...state.dailyTargets
        ]
            .sort(
                (a, b) =>
                    String(
                        b.target_date
                    ).localeCompare(
                        String(
                            a.target_date
                        )
                    )
            );

    if (
        !rows.length
    ) {

        container.innerHTML = `
            <p class="empty-message">
                Belum ada target harian.
            </p>
        `;

        return;
    }

    container.innerHTML =
        rows.map(
            item => `

                <div class="list-item">

                    <div>

                        <strong>
                            ${esc(
                                item.product
                            )}
                        </strong>

                        <small>
                            ${esc(
                                item.target_date
                            )}
                        </small>

                    </div>

                    <strong>
                        ${
                            Number(
                                item.daily_target
                            ) || 0
                        }
                        unit
                    </strong>

                </div>

            `
        ).join("");
}


// =========================================================
// SAVE DAILY TARGET
// =========================================================

$("daily-target-form")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const targetDate =
                getValue(
                    "daily-target-date"
                );

            const product =
                getValue(
                    "daily-target-product"
                );

            const dailyTarget =
                Number(
                    getValue(
                        "daily-target-value"
                    )
                );

            if (
                !targetDate ||
                !product ||
                dailyTarget < 0
            ) {

                toast(
                    "Lengkapi data target harian."
                );

                return;
            }

            try {

                await api(
                    "./api/daily_targets.php",
                    {

                        method:
                            "POST",

                        body: {

                            target_date:
                                targetDate,

                            product:
                                product,

                            daily_target:
                                dailyTarget
                        }
                    }
                );

                await loadData();

                setValue(
                    "daily-target-product",
                    ""
                );

                setValue(
                    "daily-target-value",
                    ""
                );

                setValue(
                    "daily-target-date",
                    today
                );

                renderDailyTargets();

                renderDashboard();

                toast(
                    "Target harian berhasil disimpan."
                );

            } catch (error) {

                console.error(
                    "DAILY TARGET ERROR:",
                    error
                );

                toast(
                    error.message
                );
            }
        }
    );

    // =========================================================
// VISITOR VS TRANSACTION
// =========================================================

function renderVisitorTransactionChart() {

    const canvas =
        $("visitor-transaction-chart");

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }

    const rows =
        state.stores
            .map(store => {

                const id =
                    Number(
                        store.id
                    );

                const visitor =
                    state.visitors
                        .filter(
                            item =>
                                Number(
                                    item.store_id
                                ) === id
                        )
                        .reduce(
                            (sum, item) =>
                                sum +
                                (
                                    Number(
                                        item.visitor_count
                                    ) || 0
                                ),
                            0
                        );

                const transaction =
                    state.transactions
                        .filter(
                            item =>
                                Number(
                                    item.store_id
                                ) === id
                        )
                        .reduce(
                            (sum, item) =>
                                sum +
                                (
                                    Number(
                                        item.quantity
                                    ) || 0
                                ),
                            0
                        );

                return {

                    name:
                        store.store_name,

                    visitor,

                    transaction
                };
            })
            .filter(
                row =>
                    row.visitor > 0 ||
                    row.transaction > 0
            );

    if (
        visitorTransactionChart
    ) {
        visitorTransactionChart.destroy();
    }

    visitorTransactionChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        rows.map(
                            row => row.name
                        ),

                    datasets: [

                        {
                            label:
                                "Visitor",

                            data:
                                rows.map(
                                    row =>
                                        row.visitor
                                ),

                            backgroundColor:
                                "#ed8b00",

                            borderRadius:
                                7
                        },

                        {
                            label:
                                "Transaksi",

                            data:
                                rows.map(
                                    row =>
                                        row.transaction
                                ),

                            backgroundColor:
                                "#0d72d9",

                            borderRadius:
                                7
                        }

                    ]
                },

                options: {

                    indexAxis:
                        "y",

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            position:
                                "bottom"
                        }
                    },

                    scales: {

                        x: {

                            beginAtZero:
                                true,

                            ticks: {
                                precision:
                                    0
                            }
                        },

                        y: {

                            grid: {
                                display:
                                    false
                            }
                        }
                    }
                }
            }
        );
}


// =========================================================
// CHANNEL BREAKDOWN
// =========================================================

function renderChannelBreakdown() {

    const instore =
        state.transactions
            .filter(
                row =>
                    row.channel ===
                    "Instore"
            )
            .reduce(
                (sum, row) =>
                    sum +
                    (
                        Number(
                            row.quantity
                        ) || 0
                    ),
                0
            );

    const outstore =
        state.transactions
            .filter(
                row =>
                    row.channel ===
                    "Outstore"
            )
            .reduce(
                (sum, row) =>
                    sum +
                    (
                        Number(
                            row.quantity
                        ) || 0
                    ),
                0
            );

    const max =
        Math.max(
            instore,
            outstore,
            1
        );

    setText(
        "admin-instore-total",
        `${instore} unit`
    );

    setText(
        "admin-outstore-total",
        `${outstore} unit`
    );

    if (
        $("admin-instore-bar")
    ) {

        $("admin-instore-bar")
            .style.width =
                `${
                    instore /
                    max *
                    100
                }%`;
    }

    if (
        $("admin-outstore-bar")
    ) {

        $("admin-outstore-bar")
            .style.width =
                `${
                    outstore /
                    max *
                    100
                }%`;
    }
}


// =========================================================
// TOP SALES
// =========================================================

function getTopSales(
    product
) {

    const map = {};

    state.transactions
        .filter(
            row =>
                row.product ===
                product
        )
        .forEach(
            row => {

                const id =
                    Number(
                        row.sales_id
                    );

                if (!map[id]) {

                    map[id] = {

                        sales_name:
                            row.sales_name,

                        quantity:
                            0,

                        revenue:
                            0
                    };
                }

                map[id].quantity +=
                    Number(
                        row.quantity
                    ) || 0;

                map[id].revenue +=
                    (
                        Number(
                            row.price
                        ) || 0
                    )
                    *
                    (
                        Number(
                            row.quantity
                        ) || 0
                    );
            }
        );

    return Object
        .values(map)
        .sort(
            (a, b) =>
                b.revenue -
                a.revenue
        )
        .slice(
            0,
            5
        );
}


function renderTopSales() {

    renderTopSalesList(
        "XL Prioritas",
        "top-sales-prioritas"
    );

    renderTopSalesList(
        "XLHome",
        "top-sales-home"
    );
}


function renderTopSalesList(
    product,
    id
) {

    const container =
        $(id);

    if (!container) {
        return;
    }

    const rows =
        getTopSales(
            product
        );

    if (!rows.length) {

        container.innerHTML = `
            <p class="empty-message">
                Belum ada penjualan.
            </p>
        `;

        return;
    }

    container.innerHTML =
        rows.map(
            (
                row,
                index
            ) => `

                <div
                    class="
                        top-sales-row
                        ${
                            product ===
                            "XLHome"
                                ? "home"
                                : ""
                        }
                    "
                >

                    <span class="top-sales-rank">
                        ${index + 1}
                    </span>

                    <div class="top-sales-name">

                        <strong>
                            ${esc(
                                row.sales_name
                            )}
                        </strong>

                        <small>
                            Sales
                        </small>

                    </div>

                    <span class="top-sales-qty">
                        ${row.quantity} Qty
                    </span>

                    <span class="top-sales-revenue">
                        ${money(
                            row.revenue
                        )}
                    </span>

                </div>
            `
        ).join("");
}


// =========================================================
// SALES DASHBOARD
// =========================================================

function renderSalesDashboard() {

    renderSalesRanking();

    renderSalesTrend();

    renderSalesCategoryChart();
}


// =========================================================
// SALES RANK
// =========================================================

function renderSalesRanking() {

    const userId =
        Number(
            state.user?.id ||
            0
        );

    const ranking =
        state.salesRanking;

    const mine =
        ranking.find(
            row =>
                Number(
                    row.sales_id
                ) === userId
        );

    setText(
        "metric-sales-rank",

        mine
            ? `#${mine.rank}`
            : "-"
    );

    setText(
        "metric-sales-rank-total",

        `dari ${ranking.length} Sales`
    );

    if (
        $("sales-ranking-summary")
    ) {

        $("sales-ranking-summary")
            .innerHTML =

            mine

                ? `
                    <div class="rank-highlight">

                        <span>
                            Posisi Anda
                        </span>

                        <strong>
                            #${mine.rank}
                        </strong>

                    </div>
                `

                : "";
    }

    const visible =
        ranking.slice(
            0,
            5
        );

    if (
        mine &&
        !visible.some(
            row =>
                Number(
                    row.sales_id
                ) === userId
        )
    ) {

        visible.push(
            mine
        );
    }

    if (
        $("sales-ranking-list")
    ) {

        $("sales-ranking-list")
            .innerHTML =

            visible.map(
                row => `

                    <div
                        class="
                            ranking-item
                            ${
                                Number(
                                    row.sales_id
                                ) === userId

                                    ? "me"

                                    : ""
                            }
                        "
                    >

                        <span class="rank-number">
                            #${row.rank}
                        </span>

                        <div class="rank-person">

                            <strong>
                                ${esc(
                                    row.sales_name
                                )}
                            </strong>

                            <small>
                                ${esc(
                                    row.store_name ||
                                    "-"
                                )}
                            </small>

                        </div>

                        <strong>
                            ${
                                Number(
                                    row.total_sales
                                ) || 0
                            }
                            unit
                        </strong>

                    </div>
                `
            ).join("");
    }
}


// =========================================================
// SALES TREND
// =========================================================

function renderSalesTrend() {

    const canvas =
        $("sales-progress-chart");

    if (
        !canvas ||
        typeof Chart ===
            "undefined"
    ) {
        return;
    }

    const grouped = {};

    state.transactions
        .forEach(
            row => {

                const date =
                    String(
                        row.transaction_date ||
                        ""
                    );

                if (!date) {
                    return;
                }

                grouped[date] =
                    (
                        grouped[date] ||
                        0
                    )
                    +
                    (
                        Number(
                            row.quantity
                        ) || 0
                    );
            }
        );

    const dates =
        Object
            .keys(grouped)
            .sort();

    if (
        salesProgressChart
    ) {
        salesProgressChart.destroy();
    }

    salesProgressChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        dates.map(
                            formatChartDate
                        ),

                    datasets: [

                        {
                            label:
                                "Penjualan Saya",

                            data:
                                dates.map(
                                    date =>
                                        grouped[
                                            date
                                        ]
                                ),

                            borderColor:
                                "#0d72d9",

                            backgroundColor:
                                "rgba(13,114,217,.10)",

                            borderWidth:
                                3,

                            tension:
                                .35,

                            fill:
                                true
                        }
                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display:
                                false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {
                                precision:
                                    0
                            }
                        }
                    }
                }
            }
        );
}


// =========================================================
// SALES CATEGORY
// =========================================================

function renderSalesCategoryChart() {

    const canvas =
        $("sales-category-chart");

    if (
        !canvas ||
        typeof Chart ===
            "undefined"
    ) {
        return;
    }

    const prioritas =
        totalQuantity(
            state.transactions.filter(
                row =>
                    row.product ===
                    "XL Prioritas"
            )
        );

    const home =
        totalQuantity(
            state.transactions.filter(
                row =>
                    row.product ===
                    "XLHome"
            )
        );

    if (
        salesCategoryChart
    ) {
        salesCategoryChart.destroy();
    }

    salesCategoryChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels: [
                        "XL Prioritas",
                        "XLHome"
                    ],

                    datasets: [

                        {
                            label:
                                "Penjualan Saya",

                            data: [
                                prioritas,
                                home
                            ],

                            backgroundColor: [
                                "#0d72d9",
                                "#07936a"
                            ],

                            borderRadius:
                                8
                        }
                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display:
                                false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {
                                precision:
                                    0
                            }
                        }
                    }
                }
            }
        );
}

// =========================================================
// RECAP FILTER
// =========================================================

function filteredTransactions() {

    const from =
        getValue(
            "filter-date-from"
        );

    const to =
        getValue(
            "filter-date-to"
        );

    const salesId =
        Number(
            getValue(
                "filter-sales"
            )
        ) || 0;

    const storeId =
        Number(
            getValue(
                "filter-store"
            )
        ) || 0;

    const product =
        getValue(
            "filter-product"
        );

    const channel =
        getValue(
            "filter-channel"
        );

    return state.transactions
        .filter(row => {

            const date =
                String(
                    row.transaction_date ||
                    ""
                );

            return (
                (!from || date >= from) &&
                (!to || date <= to) &&
                (
                    !salesId ||
                    Number(
                        row.sales_id
                    ) === salesId
                ) &&
                (
                    !storeId ||
                    Number(
                        row.store_id
                    ) === storeId
                ) &&
                (
                    !product ||
                    row.product === product
                ) &&
                (
                    !channel ||
                    row.channel === channel
                )
            );
        });
}


// =========================================================
// RECAP
// =========================================================

function renderRecap() {

    const rows =
        filteredTransactions();

    setText(
        "recap-count",
        rows.length
    );

    setText(
        "recap-revenue",
        money(
            totalRevenue(rows)
        )
    );

    if (
        $("recap-body")
    ) {

        $("recap-body")
            .innerHTML =
                rows.map(row => {

                    const total =
                        (
                            Number(
                                row.price
                            ) || 0
                        )
                        *
                        (
                            Number(
                                row.quantity
                            ) || 0
                        );

                    return `
                        <tr>

                            <td>
                                ${esc(
                                    row.transaction_date
                                )}
                            </td>

                            <td>
                                ${esc(
                                    row.sales_name
                                )}
                            </td>

                            <td>
                                ${esc(
                                    row.store_name
                                )}
                            </td>

                            <td>
                                ${esc(
                                    row.product
                                )}
                            </td>

                            <td>
                                ${esc(
                                    row.channel
                                )}
                            </td>

                            <td>
                                ${esc(
                                    row.price_plan
                                )}
                            </td>

                            <td>
                                ${
                                    Number(
                                        row.quantity
                                    ) || 0
                                }
                            </td>

                            <td>
                                ${money(total)}
                            </td>

                        </tr>
                    `;
                }).join("");
    }

    $("recap-empty")
        ?.classList.toggle(
            "hidden",
            rows.length > 0
        );
}


[
    "filter-date-from",
    "filter-date-to",
    "filter-sales",
    "filter-store",
    "filter-product",
    "filter-channel"
]
.forEach(id => {

    $(id)
        ?.addEventListener(
            "change",
            renderRecap
        );
});


// =========================================================
// TARGET & ACHIEVEMENT
// =========================================================

function renderTargets() {

    renderDailyTargets();
}


// =========================================================
// VISITOR
// =========================================================

function renderVisitor() {

    const container =
        $("visitor-history");

    if (!container) {
        return;
    }

    if (
        !state.visitors.length
    ) {

        container.innerHTML = `
            <p class="empty-message">
                Belum ada data Visitor.
            </p>
        `;

        return;
    }

    container.innerHTML =
        state.visitors
            .map(row => `

                <div class="list-item">

                    <div>

                        <strong>
                            ${esc(
                                row.store_name
                            )}
                        </strong>

                        <small>
                            ${esc(
                                row.visitor_date
                            )}
                        </small>

                    </div>

                    <strong>
                        ${
                            Number(
                                row.visitor_count
                            ) || 0
                        }
                    </strong>

                </div>
            `)
            .join("");
}


// =========================================================
// SAVE VISITOR
// =========================================================

$("visitor-form")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const body = {

                visitor_date:
                    getValue(
                        "visitor-date"
                    ),

                store_id:
                    Number(
                        getValue(
                            "visitor-store"
                        )
                    ),

                visitor_count:
                    Number(
                        getValue(
                            "visitor-count"
                        )
                    )
            };

            if (
                !body.visitor_date ||
                !body.store_id
            ) {

                toast(
                    "Lengkapi data Visitor."
                );

                return;
            }

            try {

                await api(
                    "./api/visitors.php",
                    {
                        method:
                            "POST",

                        body
                    }
                );

                $("visitor-form")
                    ?.reset();

                setValue(
                    "visitor-date",
                    today
                );

                await loadData();

                toast(
                    "Visitor berhasil disimpan."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// MASTER DATA
// =========================================================

function renderMaster() {

    renderStoreMaster();

    renderSalesMaster();

    renderPlanMaster();

    fillSelect(
        "sales-store",
        state.stores,
        "Pilih Store",
        row => row.id,
        row => row.store_name
    );
}


// =========================================================
// MASTER STORE
// =========================================================

function renderStoreMaster() {

    const container =
        $("store-list");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.stores.length

            ? state.stores
                .map(row => `

                    <div class="master-list-item">

                        <div class="master-item-main">

                            <strong>
                                ${esc(
                                    row.store_name
                                )}
                            </strong>

                        </div>

                        <div class="master-item-actions">

                            <button
                                type="button"
                                class="master-edit-button"
                                data-edit-store="${row.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="master-delete-button"
                                data-delete-store="${row.id}"
                            >
                                Hapus
                            </button>

                        </div>

                    </div>

                `)
                .join("")

            : `
                <p class="empty-message">
                    Belum ada Store.
                </p>
            `;
}


// =========================================================
// MASTER SALES
// =========================================================

function renderSalesMaster() {

    const container =
        $("sales-list");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.sales.length

            ? state.sales
                .map(row => `

                    <div class="master-list-item">

                        <div class="master-item-main">

                            <strong>
                                ${esc(
                                    row.full_name
                                )}
                            </strong>

                            <small>
                                ${esc(
                                    row.default_store ||
                                    row.store_name ||
                                    "-"
                                )}
                                ·
                                ${esc(
                                    row.sales_type ||
                                    "-"
                                )}
                            </small>

                        </div>

                        <div class="master-item-actions">

                            <button
                                type="button"
                                class="master-edit-button"
                                data-edit-sales="${row.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="master-delete-button"
                                data-delete-sales="${row.id}"
                            >
                                Hapus
                            </button>

                        </div>

                    </div>

                `)
                .join("")

            : `
                <p class="empty-message">
                    Belum ada Sales.
                </p>
            `;
}


// =========================================================
// MASTER PLAN
// =========================================================

function renderPlanMaster() {

    const container =
        $("plan-list");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.plans.length

            ? state.plans
                .map(row => `

                    <div class="master-list-item">

                        <div class="master-item-main">

                            <strong>
                                ${esc(
                                    row.price_plan
                                )}
                            </strong>

                            <small>
                                ${esc(
                                    row.product
                                )}
                                ·
                                ${money(
                                    row.price
                                )}
                            </small>

                        </div>

                        <div class="master-item-actions">

                            <button
                                type="button"
                                class="master-edit-button"
                                data-edit-plan="${row.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="master-delete-button"
                                data-delete-plan="${row.id}"
                            >
                                Hapus
                            </button>

                        </div>

                    </div>

                `)
                .join("")

            : `
                <p class="empty-message">
                    Belum ada Price Plan.
                </p>
            `;
}


// =========================================================
// RESET MASTER FORM
// =========================================================

function resetStoreForm() {

    $("store-form")
        ?.reset();

    setValue(
        "store-id",
        ""
    );

    setText(
        "store-submit-button",
        "Tambah Store"
    );

    $("store-cancel-edit")
        ?.classList.add(
            "hidden"
        );
}


function resetSalesForm() {

    $("sales-form")
        ?.reset();

    setValue(
        "sales-id",
        ""
    );

    setText(
        "sales-submit-button",
        "Tambah Sales"
    );

    $("sales-cancel-edit")
        ?.classList.add(
            "hidden"
        );

    fillSelect(
        "sales-store",
        state.stores,
        "Pilih Store",
        row => row.id,
        row => row.store_name
    );
}


function resetPlanForm() {

    $("plan-form")
        ?.reset();

    setValue(
        "plan-id",
        ""
    );

    setText(
        "plan-submit-button",
        "Tambah Price Plan"
    );

    $("plan-cancel-edit")
        ?.classList.add(
            "hidden"
        );
}


$("store-cancel-edit")
    ?.addEventListener(
        "click",
        resetStoreForm
    );


$("sales-cancel-edit")
    ?.addEventListener(
        "click",
        resetSalesForm
    );


$("plan-cancel-edit")
    ?.addEventListener(
        "click",
        resetPlanForm
    );


// =========================================================
// SAVE STORE
// =========================================================

$("store-form")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const id =
                Number(
                    getValue(
                        "store-id"
                    )
                ) || 0;

            const name =
                getValue(
                    "store-name"
                )
                .trim();

            if (!name) {

                toast(
                    "Nama Store wajib diisi."
                );

                return;
            }

            try {

                await api(
                    "./api/stores.php",
                    {

                        method:
                            id
                                ? "PUT"
                                : "POST",

                        body: {

                            id,

                            store_name:
                                name
                        }
                    }
                );

                resetStoreForm();

                await loadData();

                toast(
                    id
                        ? "Store diperbarui."
                        : "Store ditambahkan."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// SAVE SALES
// =========================================================

$("sales-form")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const id =
                Number(
                    getValue(
                        "sales-id"
                    )
                ) || 0;

            const body = {

                id,

                full_name:
                    getValue(
                        "sales-name"
                    )
                    .trim(),

                sales_type:
                    getValue(
                        "sales-type"
                    ),

                default_store_id:
                    Number(
                        getValue(
                            "sales-store"
                        )
                    )
            };

            if (
                !body.full_name ||
                !body.sales_type ||
                !body.default_store_id
            ) {

                toast(
                    "Lengkapi Data Sales."
                );

                return;
            }

            try {

                const result =
                    await api(
                        "./api/sales.php",
                        {

                            method:
                                id
                                    ? "PUT"
                                    : "POST",

                            body
                        }
                    );

                resetSalesForm();

                await loadData();

                if (
                    !id &&
                    result.username
                ) {

                    toast(
                        `Sales dibuat: ${result.username}`
                    );

                } else {

                    toast(
                        id
                            ? "Sales diperbarui."
                            : "Sales ditambahkan."
                    );
                }

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );

    // =========================================================
// SAVE PLAN
// =========================================================

$("plan-form")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const id =
                Number(
                    getValue(
                        "plan-id"
                    )
                ) || 0;

            const body = {

                id,

                product:
                    getValue(
                        "plan-product"
                    ),

                price_plan:
                    getValue(
                        "plan-name"
                    ).trim(),

                price:
                    Number(
                        getValue(
                            "plan-price"
                        )
                    )
            };

            if (
                !body.product ||
                !body.price_plan
            ) {

                toast(
                    "Lengkapi Price Plan."
                );

                return;
            }

            try {

                await api(
                    "./api/plans.php",
                    {
                        method:
                            id
                                ? "PUT"
                                : "POST",

                        body
                    }
                );

                resetPlanForm();

                await loadData();

                toast(
                    id
                        ? "Price Plan diperbarui."
                        : "Price Plan ditambahkan."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// EDIT / DELETE MASTER
// =========================================================

document.addEventListener(
    "click",
    async event => {

        // =====================================================
        // EDIT STORE
        // =====================================================

        const editStore =
            event.target.closest(
                "[data-edit-store]"
            );

        if (editStore) {

            const row =
                state.stores.find(
                    item =>
                        Number(
                            item.id
                        ) ===
                        Number(
                            editStore
                                .dataset
                                .editStore
                        )
                );

            if (row) {

                setValue(
                    "store-id",
                    row.id
                );

                setValue(
                    "store-name",
                    row.store_name
                );

                setText(
                    "store-submit-button",
                    "Simpan Perubahan"
                );

                $("store-cancel-edit")
                    ?.classList.remove(
                        "hidden"
                    );
            }

            return;
        }


        // =====================================================
        // EDIT SALES
        // =====================================================

        const editSales =
            event.target.closest(
                "[data-edit-sales]"
            );

        if (editSales) {

            const row =
                state.sales.find(
                    item =>
                        Number(
                            item.id
                        ) ===
                        Number(
                            editSales
                                .dataset
                                .editSales
                        )
                );

            if (row) {

                setValue(
                    "sales-id",
                    row.id
                );

                setValue(
                    "sales-name",
                    row.full_name
                );

                setValue(
                    "sales-type",
                    row.sales_type
                );

                setValue(
                    "sales-store",
                    row.default_store_id
                );

                setText(
                    "sales-submit-button",
                    "Simpan Perubahan"
                );

                $("sales-cancel-edit")
                    ?.classList.remove(
                        "hidden"
                    );
            }

            return;
        }


        // =====================================================
        // EDIT PLAN
        // =====================================================

        const editPlan =
            event.target.closest(
                "[data-edit-plan]"
            );

        if (editPlan) {

            const row =
                state.plans.find(
                    item =>
                        Number(
                            item.id
                        ) ===
                        Number(
                            editPlan
                                .dataset
                                .editPlan
                        )
                );

            if (row) {

                setValue(
                    "plan-id",
                    row.id
                );

                setValue(
                    "plan-product",
                    row.product
                );

                setValue(
                    "plan-name",
                    row.price_plan
                );

                setValue(
                    "plan-price",
                    row.price
                );

                setText(
                    "plan-submit-button",
                    "Simpan Perubahan"
                );

                $("plan-cancel-edit")
                    ?.classList.remove(
                        "hidden"
                    );
            }

            return;
        }


        // =====================================================
        // DELETE STORE
        // =====================================================

        const deleteStore =
            event.target.closest(
                "[data-delete-store]"
            );

        if (deleteStore) {

            if (
                !confirm(
                    "Hapus Store ini?"
                )
            ) {
                return;
            }

            try {

                await api(
                    `./api/stores.php?id=${
                        deleteStore
                            .dataset
                            .deleteStore
                    }`,
                    {
                        method:
                            "DELETE"
                    }
                );

                await loadData();

                toast(
                    "Store dihapus."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }

            return;
        }


        // =====================================================
        // DELETE SALES
        // =====================================================

        const deleteSales =
            event.target.closest(
                "[data-delete-sales]"
            );

        if (deleteSales) {

            if (
                !confirm(
                    "Nonaktifkan Sales ini?"
                )
            ) {
                return;
            }

            try {

                await api(
                    `./api/sales.php?id=${
                        deleteSales
                            .dataset
                            .deleteSales
                    }`,
                    {
                        method:
                            "DELETE"
                    }
                );

                await loadData();

                toast(
                    "Sales dinonaktifkan."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }

            return;
        }


        // =====================================================
        // DELETE PLAN
        // =====================================================

        const deletePlan =
            event.target.closest(
                "[data-delete-plan]"
            );

        if (deletePlan) {

            if (
                !confirm(
                    "Hapus Price Plan ini?"
                )
            ) {
                return;
            }

            try {

                await api(
                    `./api/plans.php?id=${
                        deletePlan
                            .dataset
                            .deletePlan
                    }`,
                    {
                        method:
                            "DELETE"
                    }
                );

                await loadData();

                toast(
                    "Price Plan dihapus."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    }
);


// =========================================================
// DELETE ALL STORE
// =========================================================

$("delete-all-stores")
    ?.addEventListener(
        "click",
        async () => {

            if (
                !confirm(
                    "Hapus seluruh Store yang dapat dihapus?"
                )
            ) {
                return;
            }

            try {

                await api(
                    "./api/stores.php?all=1",
                    {
                        method:
                            "DELETE"
                    }
                );

                await loadData();

                toast(
                    "Proses selesai."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// DELETE ALL SALES
// =========================================================

$("delete-all-sales")
    ?.addEventListener(
        "click",
        async () => {

            if (
                !confirm(
                    "Nonaktifkan seluruh Sales?"
                )
            ) {
                return;
            }

            try {

                await api(
                    "./api/sales.php?all=1",
                    {
                        method:
                            "DELETE"
                    }
                );

                await loadData();

                toast(
                    "Semua Sales dinonaktifkan."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// DELETE ALL PLAN
// =========================================================

$("delete-all-plans")
    ?.addEventListener(
        "click",
        async () => {

            if (
                !confirm(
                    "Hapus seluruh Price Plan?"
                )
            ) {
                return;
            }

            try {

                await api(
                    "./api/plans.php?all=1",
                    {
                        method:
                            "DELETE"
                    }
                );

                await loadData();

                toast(
                    "Proses selesai."
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// CSV ESCAPE
// =========================================================

function csvEscape(value) {

    const text =
        String(
            value ?? ""
        );

    if (
        /[",\n]/.test(
            text
        )
    ) {

        return `"${text.replaceAll(
            '"',
            '""'
        )}"`;
    }

    return text;
}


// =========================================================
// DOWNLOAD CSV
// =========================================================

function downloadCSV(
    filename,
    headers,
    rows
) {

    const content = [

        headers
            .map(
                csvEscape
            )
            .join(","),

        ...rows.map(
            row =>
                row
                    .map(
                        csvEscape
                    )
                    .join(",")
        )

    ].join("\n");

    const blob =
        new Blob(
            [
                "\uFEFF",
                content
            ],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        filename;

    document.body
        .appendChild(
            link
        );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );
}


// =========================================================
// DOWNLOAD STORE
// =========================================================

$("store-download")
    ?.addEventListener(
        "click",
        () => {

            downloadCSV(

                "data-store.csv",

                [
                    "store_name"
                ],

                state.stores.map(
                    row => [
                        row.store_name
                    ]
                )
            );
        }
    );


// =========================================================
// DOWNLOAD SALES
// =========================================================

$("sales-download")
    ?.addEventListener(
        "click",
        () => {

            downloadCSV(

                "data-sales.csv",

                [
                    "full_name",
                    "sales_type",
                    "store_name"
                ],

                state.sales.map(
                    row => [

                        row.full_name,

                        row.sales_type,

                        row.default_store ||
                        row.store_name ||
                        ""
                    ]
                )
            );
        }
    );


// =========================================================
// DOWNLOAD PRICE PLAN
// =========================================================

$("plan-download")
    ?.addEventListener(
        "click",
        () => {

            downloadCSV(

                "price-plan.csv",

                [
                    "product",
                    "price_plan",
                    "price"
                ],

                state.plans.map(
                    row => [

                        row.product,

                        row.price_plan,

                        row.price
                    ]
                )
            );
        }
    );


// =========================================================
// SIMPLE CSV PARSER
// =========================================================

function parseCSV(text) {

    const lines =
        String(text)
            .replace(
                /\r/g,
                ""
            )
            .split("\n")
            .filter(
                line =>
                    line.trim() !== ""
            );

    if (
        !lines.length
    ) {
        return [];
    }


    const parseLine =
        line => {

            const result =
                [];

            let cell =
                "";

            let quoted =
                false;

            for (
                let i = 0;
                i < line.length;
                i++
            ) {

                const char =
                    line[i];

                const next =
                    line[i + 1];

                if (
                    char === '"'
                ) {

                    if (
                        quoted &&
                        next === '"'
                    ) {

                        cell += '"';

                        i++;

                    } else {

                        quoted =
                            !quoted;
                    }

                } else if (
                    char === "," &&
                    !quoted
                ) {

                    result.push(
                        cell
                    );

                    cell =
                        "";

                } else {

                    cell +=
                        char;
                }
            }

            result.push(
                cell
            );

            return result;
        };


    const headers =
        parseLine(
            lines[0]
        )
        .map(
            value =>
                value
                    .trim()
                    .toLowerCase()
        );


    return lines
        .slice(1)
        .map(
            line => {

                const cells =
                    parseLine(
                        line
                    );

                const row =
                    {};

                headers
                    .forEach(
                        (
                            header,
                            index
                        ) => {

                            row[
                                header
                            ] =
                                cells[
                                    index
                                ] ?? "";
                        }
                    );

                return row;
            }
        );
}

// =========================================================
// CSV UPLOAD STORE
// =========================================================

$("store-upload")
    ?.addEventListener(
        "change",
        async event => {

            const file =
                event.target
                    .files?.[0];

            if (!file) {
                return;
            }

            try {

                const rows =
                    parseCSV(
                        await file.text()
                    );

                let success =
                    0;

                for (
                    const row of rows
                ) {

                    const name =
                        (
                            row.store_name ||
                            row["nama store"] ||
                            row.store ||
                            ""
                        ).trim();

                    if (!name) {
                        continue;
                    }

                    try {

                        await api(
                            "./api/stores.php",
                            {
                                method:
                                    "POST",

                                body: {
                                    store_name:
                                        name
                                }
                            }
                        );

                        success++;

                    } catch (error) {

                        console.warn(
                            "IMPORT STORE:",
                            error
                        );
                    }
                }

                event.target.value =
                    "";

                await loadData();

                toast(
                    `${success} Store berhasil diimport.`
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// CSV UPLOAD SALES
// =========================================================

$("sales-upload")
    ?.addEventListener(
        "change",
        async event => {

            const file =
                event.target
                    .files?.[0];

            if (!file) {
                return;
            }

            try {

                const rows =
                    parseCSV(
                        await file.text()
                    );

                let success =
                    0;

                for (
                    const row of rows
                ) {

                    const name =
                        (
                            row.full_name ||
                            row["nama sales"] ||
                            row.sales ||
                            ""
                        ).trim();

                    let type =
                        (
                            row.sales_type ||
                            row["kategori sales"] ||
                            ""
                        ).trim();

                    const normalized =
                        type
                            .toLowerCase()
                            .replaceAll(
                                "-",
                                " "
                            );

                    if (
                        normalized ===
                        "walk in"
                    ) {

                        type =
                            "Walk-in";
                    }

                    if (
                        normalized ===
                        "walk out"
                    ) {

                        type =
                            "Walk-out";
                    }

                    const storeName =
                        (
                            row.store_name ||
                            row["store terkait"] ||
                            row.store ||
                            ""
                        ).trim();

                    const store =
                        state.stores.find(
                            item =>
                                String(
                                    item.store_name
                                )
                                .toLowerCase()
                                ===
                                storeName
                                    .toLowerCase()
                        );

                    if (
                        !name ||
                        !store ||
                        ![
                            "Walk-in",
                            "Walk-out"
                        ].includes(type)
                    ) {

                        continue;
                    }

                    try {

                        await api(
                            "./api/sales.php",
                            {
                                method:
                                    "POST",

                                body: {

                                    full_name:
                                        name,

                                    sales_type:
                                        type,

                                    default_store_id:
                                        Number(
                                            store.id
                                        )
                                }
                            }
                        );

                        success++;

                    } catch (error) {

                        console.warn(
                            "IMPORT SALES:",
                            error
                        );
                    }
                }

                event.target.value =
                    "";

                await loadData();

                toast(
                    `${success} Sales berhasil diimport.`
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// CSV UPLOAD PRICE PLAN
// =========================================================

$("plan-upload")
    ?.addEventListener(
        "change",
        async event => {

            const file =
                event.target
                    .files?.[0];

            if (!file) {
                return;
            }

            try {

                const rows =
                    parseCSV(
                        await file.text()
                    );

                let success =
                    0;

                for (
                    const row of rows
                ) {

                    const product =
                        (
                            row.product ||
                            row.produk ||
                            ""
                        ).trim();

                    const plan =
                        (
                            row.price_plan ||
                            row["price plan"] ||
                            row["nama price plan"] ||
                            ""
                        ).trim();

                    const rawPrice =
                        String(
                            row.price ||
                            row.harga ||
                            row["harga plan"] ||
                            0
                        );

                    const price =
                        Number(
                            rawPrice
                                .replaceAll(
                                    ".",
                                    ""
                                )
                                .replace(
                                    ",",
                                    "."
                                )
                        );

                    if (
                        ![
                            "XL Prioritas",
                            "XLHome"
                        ].includes(
                            product
                        )
                        ||
                        !plan
                    ) {

                        continue;
                    }

                    try {

                        await api(
                            "./api/plans.php",
                            {
                                method:
                                    "POST",

                                body: {

                                    product,

                                    price_plan:
                                        plan,

                                    price
                                }
                            }
                        );

                        success++;

                    } catch (error) {

                        console.warn(
                            "IMPORT PLAN:",
                            error
                        );
                    }
                }

                event.target.value =
                    "";

                await loadData();

                toast(
                    `${success} Price Plan berhasil diimport.`
                );

            } catch (error) {

                toast(
                    error.message
                );
            }
        }
    );


// =========================================================
// MIDNIGHT REFRESH
// =========================================================

function scheduleMidnightRefresh() {

    const now =
        new Date();

    const next =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0,
            0,
            2
        );

    const delay =
        next.getTime() -
        now.getTime();

    setTimeout(
        () => {

            window.location
                .reload();

        },
        delay
    );
}


scheduleMidnightRefresh();


// =========================================================
// DEFAULT FORM VALUES
// =========================================================

setValue(
    "transaction-date",
    today
);

setValue(
    "transaction-quantity",
    1
);

setValue(
    "visitor-date",
    today
);

setValue(
    "daily-target-date",
    today
);

calculateTotal();


// =========================================================
// SESSION RESTORE
// =========================================================

async function initializeApplication() {

    try {

        const session =
            await api(
                "./api/session.php"
            );

        console.log(
            "SESSION CHECK:",
            session
        );

        if (
            session.logged_in ===
                true
            &&
            session.user
        ) {

            state.user =
                session.user;

            state.role =
                session.user.role;

            state.selectedRole =
                session.user.role;

            await startApplication();

            return;
        }

        state.user =
            null;

        state.role =
            "";

        state.selectedRole =
            "";

        /*
        Tidak mengambil data Price Plan
        saat masih berada di landing publik.
        */

        showLanding();

    } catch (error) {

        console.error(
            "SESSION ERROR:",
            error
        );

        state.user =
            null;

        state.role =
            "";

        state.selectedRole =
            "";

        showLanding();
    }
}


// =========================================================
// RUN
// =========================================================

await initializeApplication();

});
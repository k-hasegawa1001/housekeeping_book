import { useState, useEffect } from "react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category_id: "",
    payment_method_id: "",
    amount: "",
    note: "",
  });

  const [filterCategory, setFilterCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  // --- ★修正: 参照される前に handleLogout を定義 ---
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setTransactions([]);
  };

  // --- カスタムfetch関数 ---
  const fetchWithAuth = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (res.status === 401) {
        handleLogout(); // ここで安全に呼び出せます
        throw new Error("認証の有効期限が切れました。再度ログインしてください。");
      }
      if (!res.ok) throw new Error("通信エラーが発生しました");
      return res.json();
    });
  };

  // --- データ取得処理 ---
  const fetchData = () => {
    setLoading(true);
    Promise.all([fetchWithAuth("/api/transactions"), fetchWithAuth("/api/categories"), fetchWithAuth("/api/payment-methods")])
      .then(([txData, catData, pmData]) => {
        const catMap = {};
        catData.forEach((c) => {
          catMap[c.id] = c.name;
        });

        const pmMap = {};
        pmData.forEach((p) => {
          pmMap[p.id] = p.name;
        });

        setCategories(catMap);
        setPaymentMethods(pmMap);
        setTransactions(txData);

        if (catData.length > 0 && pmData.length > 0 && !formData.category_id) {
          setFormData((prev) => ({
            ...prev,
            category_id: catData[0].id,
            payment_method_id: pmData[0].id,
          }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // --- ログイン処理 ---
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    const params = new URLSearchParams();
    params.append("username", loginData.username);
    params.append("password", loginData.password);

    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    })
      .then((res) => {
        if (!res.ok) throw new Error("ユーザー名またはパスワードが間違っています");
        return res.json();
      })
      .then((data) => {
        setToken(data.access_token);
        localStorage.setItem("token", data.access_token);
        setLoginData({ username: "", password: "" });
      })
      .catch((err) => {
        setLoginError(err.message);
      });
  };

  // --- 家計簿データの登録処理 ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetchWithAuth("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: Number(formData.category_id),
        payment_method_id: Number(formData.payment_method_id),
        amount: Number(formData.amount),
        date: formData.date,
        note: formData.note,
      }),
    })
      .then((newTransaction) => {
        setTransactions((prev) => [...prev, newTransaction]);
        setFormData((prev) => ({ ...prev, amount: "", note: "" }));
      })
      .catch((err) => alert(err.message));
  };

  // --- 表示用データの加工 ---
  const displayedTransactions = transactions
    .filter((t) => filterCategory === "" || t.category_id === Number(filterCategory))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOrder === "desc") {
        if (dateA === dateB) return b.id - a.id;
        return dateB - dateA;
      } else {
        if (dateA === dateB) return a.id - b.id;
        return dateA - dateB;
      }
    });

  if (!token) {
    return (
      <div style={{ padding: "50px", fontFamily: "sans-serif", maxWidth: "400px", margin: "0 auto" }}>
        <h2>家計簿アプリ - ログイン</h2>
        {loginError && <div style={{ color: "red", marginBottom: "10px" }}>{loginError}</div>}
        <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label>ユーザー名:</label>
            <br />
            <input type="text" name="username" value={loginData.username} onChange={handleLoginChange} required style={{ width: "100%", padding: "8px" }} />
          </div>
          <div>
            <label>パスワード:</label>
            <br />
            <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} required style={{ width: "100%", padding: "8px" }} />
          </div>
          <button type="submit" style={{ padding: "10px", backgroundColor: "#007BFF", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "800px" }}>
        <h1>家計簿アプリ</h1>
        <button onClick={handleLogout} style={{ padding: "5px 15px", cursor: "pointer" }}>
          ログアウト
        </button>
      </div>

      {loading && <div>読み込み中...</div>}
      {error && <div style={{ color: "red" }}>エラーが発生しました: {error}</div>}

      <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#333", borderRadius: "8px", maxWidth: "800px" }}>
        <h2 style={{ marginTop: 0 }}>新規登録</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          <select name="category_id" value={formData.category_id} onChange={handleChange} required>
            {Object.entries(categories).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select name="payment_method_id" value={formData.payment_method_id} onChange={handleChange} required>
            {Object.entries(paymentMethods).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <input type="number" name="amount" placeholder="金額" value={formData.amount} onChange={handleChange} required style={{ width: "100px" }} />
          <input type="text" name="note" placeholder="メモ" value={formData.note} onChange={handleChange} style={{ flexGrow: 1 }} />
          <button type="submit" style={{ padding: "5px 15px", cursor: "pointer" }}>
            登録
          </button>
        </form>
      </div>

      <div style={{ marginBottom: "15px", display: "flex", gap: "15px", alignItems: "center" }}>
        <div>
          <label style={{ marginRight: "5px" }}>カテゴリ絞り込み:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">すべて</option>
            {Object.entries(categories).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ marginRight: "5px" }}>並べ替え:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">日付の新しい順</option>
            <option value="asc">日付の古い順</option>
          </select>
        </div>
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", maxWidth: "800px" }}>
        <thead style={{ backgroundColor: "#555", color: "#fff" }}>
          <tr>
            <th>ID</th>
            <th>日付</th>
            <th>カテゴリ</th>
            <th>支払方法</th>
            <th>金額</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          {displayedTransactions.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.date}</td>
              <td>{categories[t.category_id] || "不明"}</td>
              <td>{paymentMethods[t.payment_method_id] || "不明"}</td>
              <td style={{ textAlign: "right" }}>{t.amount.toLocaleString()}円</td>
              <td>{t.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

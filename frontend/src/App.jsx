import { useState, useEffect } from "react";

function App() {
  // --- 1. 状態管理（State） ---
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // フォーム入力値
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category_id: "",
    payment_method_id: "",
    amount: "",
    note: "",
  });

  // 絞り込み・並べ替え用のステート（追加）
  const [filterCategory, setFilterCategory] = useState(""); // 空文字なら「すべて」
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc'=新しい順, 'asc'=古い順

  // --- 2. データ取得（初回のみ実行） ---
  const fetchData = () => {
    Promise.all([fetch("/api/transactions").then((res) => res.json()), fetch("/api/categories").then((res) => res.json()), fetch("/api/payment-methods").then((res) => res.json())])
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
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 3. イベントハンドラ ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("/api/transactions", {
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
      .then((res) => {
        if (!res.ok) throw new Error("登録に失敗しました");
        return res.json(); // APIが返す「作成された新しいデータ1件」を受け取る
      })
      .then((newTransaction) => {
        // ★全件再取得せず、現在の配列の末尾に新しいデータを追加するだけ！
        setTransactions((prev) => [...prev, newTransaction]);

        // フォームの金額とメモをリセット
        setFormData((prev) => ({ ...prev, amount: "", note: "" }));
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  // --- 4. 画面表示のためのデータ加工（絞り込みと並べ替え） ---
  const displayedTransactions = transactions
    // 絞り込み処理
    .filter((t) => {
      if (filterCategory === "") return true; // 「すべて」の場合は全部通す
      return t.category_id === Number(filterCategory);
    })
    // 並べ替え処理
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOrder === "desc") {
        // 新しい順（降順）: 日付が新しいものが上、同じならIDが大きい（新しい）ものが上
        if (dateA === dateB) return b.id - a.id;
        return dateB - dateA;
      } else {
        // 古い順（昇順）: 日付が古いものが上、同じならIDが小さい（古い）ものが上
        if (dateA === dateB) return a.id - b.id;
        return dateA - dateB;
      }
    });

  // --- 5. 描画（Render） ---
  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラーが発生しました: {error}</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>家計簿アプリ</h1>

      {/* 登録フォーム */}
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

      {/* 絞り込み・並べ替えコントロール */}
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

      {/* テーブル */}
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
          {/* 元の transactions ではなく、加工済みの displayedTransactions をループする */}
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

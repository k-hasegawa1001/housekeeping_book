import { useState, useEffect } from "react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // フォームの入力値を管理するステート
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0], // 今日の日付を初期値に
    category_id: "",
    payment_method_id: "",
    amount: "",
    note: "",
  });

  // データの取得処理（登録後にも再利用できるように関数化）
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

        // カテゴリと支払方法のドロップダウンの初期値（先頭の要素）をセット
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

  // 初回表示時にデータを取得
  useEffect(() => {
    fetchData();
  }, []);

  // フォームの入力が変更された時の処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 「登録」ボタンが押された時の処理
  const handleSubmit = (e) => {
    e.preventDefault(); // 画面の再読み込みを防ぐ

    // FastAPIへPOSTリクエストを送信
    fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 文字列になっている数値をNumber型に変換して送信
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
        return res.json();
      })
      .then(() => {
        // 登録に成功したら、フォームの金額とメモを空に戻す
        setFormData((prev) => ({ ...prev, amount: "", note: "" }));
        // 一覧データを最新状態に再取得
        fetchData();
      })
      .catch((err) => {
        alert(err.message);
      });
  };

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

      <h2>取引履歴</h2>
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
          {transactions.map((t) => (
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

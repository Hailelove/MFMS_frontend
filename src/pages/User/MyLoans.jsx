import React, { useEffect, useState } from "react";
import api from "../../services/api";
import moment from "moment";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 10;

// Extracted Badge component to clean up the main render loop
const TransactionBadge = ({ type, paymentTarget }) => {
  const badgeStyles = {
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    display: "inline-block",
  };

  if (type === "loan") {
    return (
      <span style={{ ...badgeStyles, background: "#fee2e2", color: "#991b1b" }}>
        Loan Disbursement
      </span>
    );
  }
  if (type === "interest") {
    return (
      <span style={{ ...badgeStyles, background: "#fef3c7", color: "#92400e" }}>
        Interest Charged
      </span>
    );
  }
  if (type === "fine") {
    return (
      <span style={{ ...badgeStyles, background: "#e0e7ff", color: "#3730a3" }}>
        Fine / Penalty
      </span>
    );
  }
  if (type === "repayment") {
    if (paymentTarget === "interest") {
      return (
        <span
          style={{ ...badgeStyles, background: "#d1fae5", color: "#065f46" }}
        >
          Payment → Interest
        </span>
      );
    }
    if (paymentTarget === "principal") {
      return (
        <span
          style={{ ...badgeStyles, background: "#dcfce7", color: "#166534" }}
        >
          Payment → Principal
        </span>
      );
    }
    return (
      <span style={{ ...badgeStyles, background: "#dcfce7", color: "#166534" }}>
        Payment
      </span>
    );
  }
  return <span style={badgeStyles}>{type}</span>;
};

const MyLoans = () => {
  const [loanData, setLoanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'principal' | 'interest'

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await api.get("/users/loans/me");
        setLoanData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch loan information",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  if (loading) return <div className="spinner"></div>;
  if (error)
    return (
      <div
        className="card"
        style={{ color: "var(--danger)", padding: "1.5rem" }}
      >
        {error}
      </div>
    );
  if (!loanData)
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        No loan data available.
      </div>
    );

  const history = loanData.history || [];

  // Filter transactions by tab
  const filteredHistory = history.filter((tx) => {
    if (activeTab === "principal")
      return (
        tx.type === "loan" ||
        (tx.type === "repayment" && tx.paymentTarget === "principal")
      );
    if (activeTab === "interest")
      return (
        tx.type === "interest" ||
        tx.type === "fine" ||
        (tx.type === "repayment" && tx.paymentTarget === "interest")
      );
    return true;
  });

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const hasActiveLoan = (loanData.totalDisbursed || 0) > 0;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      <div className="flex-between mb-4">
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#1e293b",
            margin: 0,
          }}
        >
          My Loan Account
        </h2>
      </div>

      {!hasActiveLoan ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "#64748b",
            background: "#fff",
            borderRadius: "12px",
          }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }}>🏦</div>
          <h3
            style={{
              color: "#334155",
              marginBottom: "0.5rem",
              fontSize: "1.25rem",
            }}
          >
            No Active Loans Found
          </h3>
          <p style={{ margin: 0, fontSize: "0.95rem" }}>
            You currently have no active loan records. Contact your
            administrator for assistance.
          </p>
        </div>
      ) : (
        <>
          {/* ── Metric Grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Principal Card */}
            <div
              className="card"
              style={{
                padding: "1.5rem",
                borderTop: "4px solid var(--danger)",
                background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <span style={{ fontSize: "1.75rem" }}>🏛️</span>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Principal Balance
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Original loan amount outstanding
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color:
                    (loanData.principalBalance || 0) > 0
                      ? "var(--danger)"
                      : "#10b981",
                  marginBottom: "1.25rem",
                  letterSpacing: "-0.02em",
                }}
              >
                ${(loanData.principalBalance || 0).toFixed(2)}
              </div>
              <div
                style={{
                  borderTop: "1px solid #fee2e2",
                  paddingTop: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Total Disbursed</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>
                    ${(loanData.totalDisbursed || 0).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Principal Repaid</span>
                  <span style={{ fontWeight: 600, color: "#10b981" }}>
                    ${(loanData.totalPrincipalRepaid || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Interest Card */}
            <div
              className="card"
              style={{
                padding: "1.5rem",
                borderTop: "4px solid #f59e0b",
                background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <span style={{ fontSize: "1.75rem" }}>📈</span>
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Interest Balance
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Accrued interest outstanding
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color:
                    (loanData.interestBalance || 0) > 0 ? "#d97706" : "#10b981",
                  marginBottom: "1.25rem",
                  letterSpacing: "-0.02em",
                }}
              >
                ${(loanData.interestBalance || 0).toFixed(2)}
              </div>
              <div
                style={{
                  borderTop: "1px solid #fde68a",
                  paddingTop: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "#64748b" }}>
                    Total Interest Charged
                  </span>
                  <span style={{ fontWeight: 600, color: "#d97706" }}>
                    ${(loanData.totalInterestAccrued || 0).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Interest Paid</span>
                  <span style={{ fontWeight: 600, color: "#10b981" }}>
                    ${(loanData.totalInterestRepaid || 0).toFixed(2)}
                  </span>
                </div>
                {(loanData.totalFines || 0) > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Fines Added</span>
                    <span style={{ fontWeight: 600, color: "#7c3aed" }}>
                      ${(loanData.totalFines || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Combined Outstanding Banner */}
          <div
            className="card"
            style={{
              padding: "1.25rem 1.5rem",
              marginBottom: "2rem",
              background:
                (loanData.totalOutstanding || 0) > 0
                  ? "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)"
                  : "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
              borderLeft: `5px solid ${(loanData.totalOutstanding || 0) > 0 ? "var(--danger)" : "#10b981"}`,
              borderRadius: "8px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#1e293b",
                    fontSize: "1.05rem",
                  }}
                >
                  Total Outstanding Balance
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Combined sum of principal and accrued interest
                </div>
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color:
                    (loanData.totalOutstanding || 0) > 0
                      ? "var(--danger)"
                      : "#10b981",
                  letterSpacing: "-0.02em",
                }}
              >
                ${(loanData.totalOutstanding || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* ── Transactions Panel ── */}
          <div
            className="table-container"
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Transaction History
              </h3>

              {/* Filter Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "0.35rem",
                  background: "#f1f5f9",
                  padding: "0.25rem",
                  borderRadius: "9999px",
                }}
              >
                {[
                  { key: "all", label: "All" },
                  { key: "principal", label: "🏛️ Principal" },
                  { key: "interest", label: "📈 Interest" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    style={{
                      padding: "0.4rem 1rem",
                      borderRadius: "9999px",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      background:
                        activeTab === tab.key ? "#ffffff" : "transparent",
                      color: activeTab === tab.key ? "#1e293b" : "#64748b",
                      boxShadow:
                        activeTab === tab.key
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredHistory.length > 0 ? (
              <>
                <div className="table-scroll">
                  <table
                    className="data-table"
                    style={{ width: "100%", borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <th
                          style={{
                            textAlign: "left",
                            padding: "1rem 1.5rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "1rem 1.5rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "1rem 1.5rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "1rem 1.5rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((tx) => (
                        <tr
                          key={tx._id}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          <td
                            style={{
                              padding: "1rem 1.5rem",
                              fontSize: "0.88rem",
                              color: "#334155",
                            }}
                          >
                            {moment(tx.date).format("MMMM Do YYYY")}
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <TransactionBadge
                              type={tx.type}
                              paymentTarget={tx.paymentTarget}
                            />
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.5rem",
                              fontSize: "0.9rem",
                              fontWeight: 700,
                              color:
                                tx.type === "repayment"
                                  ? "#10b981"
                                  : tx.type === "interest"
                                    ? "#d97706"
                                    : tx.type === "fine"
                                      ? "#7c3aed"
                                      : "var(--danger)",
                            }}
                          >
                            {tx.type === "repayment" ? "−" : "+"}$
                            {(tx.amount || 0).toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.5rem",
                              fontSize: "0.82rem",
                              color: "#64748b",
                              maxWidth: "320px",
                              lineHeight: 1.4,
                            }}
                          >
                            {tx.type === "interest" &&
                            tx.interestPeriod?.periodStart ? (
                              <span>
                                Period:{" "}
                                {moment(tx.interestPeriod.periodStart).format(
                                  "MMM D",
                                )}{" "}
                                –{" "}
                                {moment(tx.interestPeriod.periodEnd).format(
                                  "MMM D, YYYY",
                                )}
                                <br />
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "0.78rem",
                                  }}
                                >
                                  {(
                                    (tx.interestPeriod.interestRate || 0.01) *
                                    100
                                  ).toFixed(1)}
                                  % on $
                                  {(
                                    tx.interestPeriod.principalBalance || 0
                                  ).toFixed(2)}
                                </span>
                              </span>
                            ) : (
                              tx.note || "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredHistory.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: "3rem 1.5rem",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                <span
                  style={{
                    fontSize: "2rem",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  🔍
                </span>
                {activeTab === "all"
                  ? "No transactions found."
                  : `No ${activeTab} transactions found.`}
              </div>
            )}
          </div>

          {/* Information Footer */}
          <div
            className="card"
            style={{
              marginTop: "1.5rem",
              padding: "1.25rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "0.82rem",
              color: "#475569",
              lineHeight: 1.7,
            }}
          >
            <strong
              style={{
                color: "#1e293b",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              ℹ️ Terms & Settlement Protocol:
            </strong>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <li>
                The <strong>principal balance</strong> is lowered explicitly by
                target-specific principal repayments.
              </li>
              <li>
                Interest calculates at a flat{" "}
                <strong>1% of your current principal balance</strong> per 4-week
                iteration cycle.
              </li>
              <li>
                Incoming ledger adjustments are designated toward interest
                liabilities or principal reduction by account administrators.
              </li>
              <li>
                Balances modify directly upon validation and ledger confirmation
                of the clearing transaction.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default MyLoans;

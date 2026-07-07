// import React, { useEffect, useState } from "react";
// import api from "../../services/api";
// import moment from "moment";
// import Pagination from "../../components/Pagination";

// const ITEMS_PER_PAGE = 10;

// // Extracted Badge component to clean up the main render loop
// const TransactionBadge = ({ type, paymentTarget }) => {
//   const badgeStyles = {
//     padding: "0.25rem 0.75rem",
//     borderRadius: "9999px",
//     fontSize: "0.75rem",
//     fontWeight: 600,
//     display: "inline-block",
//   };

//   if (type === "loan") {
//     return (
//       <span style={{ ...badgeStyles, background: "#fee2e2", color: "#991b1b" }}>
//         Loan Disbursement
//       </span>
//     );
//   }
//   if (type === "interest") {
//     return (
//       <span style={{ ...badgeStyles, background: "#fef3c7", color: "#92400e" }}>
//         Interest Charged
//       </span>
//     );
//   }
//   if (type === "fine") {
//     return (
//       <span style={{ ...badgeStyles, background: "#e0e7ff", color: "#3730a3" }}>
//         Fine / Penalty
//       </span>
//     );
//   }
//   if (type === "repayment") {
//     if (paymentTarget === "interest") {
//       return (
//         <span
//           style={{ ...badgeStyles, background: "#d1fae5", color: "#065f46" }}
//         >
//           Payment → Interest
//         </span>
//       );
//     }
//     if (paymentTarget === "principal") {
//       return (
//         <span
//           style={{ ...badgeStyles, background: "#dcfce7", color: "#166534" }}
//         >
//           Payment → Principal
//         </span>
//       );
//     }
//     return (
//       <span style={{ ...badgeStyles, background: "#dcfce7", color: "#166534" }}>
//         Payment
//       </span>
//     );
//   }
//   return <span style={badgeStyles}>{type}</span>;
// };

// const MyLoans = () => {
//   const [loanData, setLoanData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [activeTab, setActiveTab] = useState("all"); // 'all' | 'principal' | 'interest'

//   useEffect(() => {
//     const fetchLoans = async () => {
//       try {
//         const response = await api.get("/users/loans/me");
//         setLoanData(response.data);
//       } catch (err) {
//         setError(
//           err.response?.data?.message || "Failed to fetch loan information",
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLoans();
//   }, []);

//   if (loading) return <div className="spinner"></div>;
//   if (error)
//     return (
//       <div
//         className="card"
//         style={{ color: "var(--danger)", padding: "1.5rem" }}
//       >
//         {error}
//       </div>
//     );
//   if (!loanData)
//     return (
//       <div className="card" style={{ padding: "1.5rem" }}>
//         No loan data available.
//       </div>
//     );

//   const history = loanData.history || [];

//   // Filter transactions by tab
//   const filteredHistory = history.filter((tx) => {
//     if (activeTab === "principal")
//       return (
//         tx.type === "loan" ||
//         (tx.type === "repayment" && tx.paymentTarget === "principal")
//       );
//     if (activeTab === "interest")
//       return (
//         tx.type === "interest" ||
//         tx.type === "fine" ||
//         (tx.type === "repayment" && tx.paymentTarget === "interest")
//       );
//     return true;
//   });

//   const paginatedHistory = filteredHistory.slice(
//     (currentPage - 1) * ITEMS_PER_PAGE,
//     currentPage * ITEMS_PER_PAGE,
//   );

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     setCurrentPage(1);
//   };

//   const hasActiveLoan = (loanData.totalDisbursed || 0) > 0;

//   return (
//     <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
//       <div className="flex-between mb-4">
//         <h2
//           style={{
//             fontSize: "1.5rem",
//             fontWeight: 700,
//             color: "#1e293b",
//             margin: 0,
//           }}
//         >
//           My Loan Account
//         </h2>
//       </div>

//       {!hasActiveLoan ? (
//         <div
//           className="card"
//           style={{
//             textAlign: "center",
//             padding: "4rem 2rem",
//             color: "#64748b",
//             background: "#fff",
//             borderRadius: "12px",
//           }}
//         >
//           <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }}>🏦</div>
//           <h3
//             style={{
//               color: "#334155",
//               marginBottom: "0.5rem",
//               fontSize: "1.25rem",
//             }}
//           >
//             No Active Loans Found
//           </h3>
//           <p style={{ margin: 0, fontSize: "0.95rem" }}>
//             You currently have no active loan records. Contact your
//             administrator for assistance.
//           </p>
//         </div>
//       ) : (
//         <>
//           {/* ── Metric Grid ── */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//               gap: "1.5rem",
//               marginBottom: "1.5rem",
//             }}
//           >
//             {/* Principal Card */}
//             <div
//               className="card"
//               style={{
//                 padding: "1.5rem",
//                 borderTop: "4px solid var(--danger)",
//                 background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)",
//                 borderRadius: "12px",
//                 boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "0.75rem",
//                   marginBottom: "1.25rem",
//                 }}
//               >
//                 <span style={{ fontSize: "1.75rem" }}>🏛️</span>
//                 <div>
//                   <div
//                     style={{
//                       fontSize: "0.75rem",
//                       fontWeight: 700,
//                       color: "#64748b",
//                       textTransform: "uppercase",
//                       letterSpacing: "0.05em",
//                     }}
//                   >
//                     Principal Balance
//                   </div>
//                   <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
//                     Original loan amount outstanding
//                   </div>
//                 </div>
//               </div>
//               <div
//                 style={{
//                   fontSize: "2.25rem",
//                   fontWeight: 800,
//                   color:
//                     (loanData.principalBalance || 0) > 0
//                       ? "var(--danger)"
//                       : "#10b981",
//                   marginBottom: "1.25rem",
//                   letterSpacing: "-0.02em",
//                 }}
//               >
//                 ${(loanData.principalBalance || 0).toFixed(2)}
//               </div>
//               <div
//                 style={{
//                   borderTop: "1px solid #fee2e2",
//                   paddingTop: "0.85rem",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "0.5rem",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     fontSize: "0.85rem",
//                   }}
//                 >
//                   <span style={{ color: "#64748b" }}>Total Disbursed</span>
//                   <span style={{ fontWeight: 600, color: "#1e293b" }}>
//                     ${(loanData.totalDisbursed || 0).toFixed(2)}
//                   </span>
//                 </div>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     fontSize: "0.85rem",
//                   }}
//                 >
//                   <span style={{ color: "#64748b" }}>Principal Repaid</span>
//                   <span style={{ fontWeight: 600, color: "#10b981" }}>
//                     ${(loanData.totalPrincipalRepaid || 0).toFixed(2)}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Interest Card */}
//             <div
//               className="card"
//               style={{
//                 padding: "1.5rem",
//                 borderTop: "4px solid #f59e0b",
//                 background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
//                 borderRadius: "12px",
//                 boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "0.75rem",
//                   marginBottom: "1.25rem",
//                 }}
//               >
//                 <span style={{ fontSize: "1.75rem" }}>📈</span>
//                 <div>
//                   <div
//                     style={{
//                       fontSize: "0.75rem",
//                       fontWeight: 700,
//                       color: "#64748b",
//                       textTransform: "uppercase",
//                       letterSpacing: "0.05em",
//                     }}
//                   >
//                     Interest Balance
//                   </div>
//                   <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
//                     Accrued interest outstanding
//                   </div>
//                 </div>
//               </div>
//               <div
//                 style={{
//                   fontSize: "2.25rem",
//                   fontWeight: 800,
//                   color:
//                     (loanData.interestBalance || 0) > 0 ? "#d97706" : "#10b981",
//                   marginBottom: "1.25rem",
//                   letterSpacing: "-0.02em",
//                 }}
//               >
//                 ${(loanData.interestBalance || 0).toFixed(2)}
//               </div>
//               <div
//                 style={{
//                   borderTop: "1px solid #fde68a",
//                   paddingTop: "0.85rem",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "0.5rem",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     fontSize: "0.85rem",
//                   }}
//                 >
//                   <span style={{ color: "#64748b" }}>
//                     Total Interest Charged
//                   </span>
//                   <span style={{ fontWeight: 600, color: "#d97706" }}>
//                     ${(loanData.totalInterestAccrued || 0).toFixed(2)}
//                   </span>
//                 </div>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     fontSize: "0.85rem",
//                   }}
//                 >
//                   <span style={{ color: "#64748b" }}>Interest Paid</span>
//                   <span style={{ fontWeight: 600, color: "#10b981" }}>
//                     ${(loanData.totalInterestRepaid || 0).toFixed(2)}
//                   </span>
//                 </div>
//                 {(loanData.totalFines || 0) > 0 && (
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       fontSize: "0.85rem",
//                     }}
//                   >
//                     <span style={{ color: "#64748b" }}>Fines Added</span>
//                     <span style={{ fontWeight: 600, color: "#7c3aed" }}>
//                       ${(loanData.totalFines || 0).toFixed(2)}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Combined Outstanding Banner */}
//           <div
//             className="card"
//             style={{
//               padding: "1.25rem 1.5rem",
//               marginBottom: "2rem",
//               background:
//                 (loanData.totalOutstanding || 0) > 0
//                   ? "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)"
//                   : "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
//               borderLeft: `5px solid ${(loanData.totalOutstanding || 0) > 0 ? "var(--danger)" : "#10b981"}`,
//               borderRadius: "8px",
//               boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 flexWrap: "wrap",
//                 gap: "0.75rem",
//               }}
//             >
//               <div>
//                 <div
//                   style={{
//                     fontWeight: 700,
//                     color: "#1e293b",
//                     fontSize: "1.05rem",
//                   }}
//                 >
//                   Total Outstanding Balance
//                 </div>
//                 <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
//                   Combined sum of principal and accrued interest
//                 </div>
//               </div>
//               <div
//                 style={{
//                   fontSize: "2.25rem",
//                   fontWeight: 800,
//                   color:
//                     (loanData.totalOutstanding || 0) > 0
//                       ? "var(--danger)"
//                       : "#10b981",
//                   letterSpacing: "-0.02em",
//                 }}
//               >
//                 ${(loanData.totalOutstanding || 0).toFixed(2)}
//               </div>
//             </div>
//           </div>

//           {/* ── Transactions Panel ── */}
//           <div
//             className="table-container"
//             style={{
//               background: "#ffffff",
//               borderRadius: "12px",
//               border: "1px solid #e2e8f0",
//               overflow: "hidden",
//             }}
//           >
//             <div
//               style={{
//                 padding: "1.25rem 1.5rem",
//                 borderBottom: "1px solid #e2e8f0",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 flexWrap: "wrap",
//                 gap: "1rem",
//               }}
//             >
//               <h3
//                 style={{
//                   margin: 0,
//                   fontSize: "1.1rem",
//                   fontWeight: 700,
//                   color: "#1e293b",
//                 }}
//               >
//                 Transaction History
//               </h3>

//               {/* Filter Tabs */}
//               <div
//                 style={{
//                   display: "flex",
//                   gap: "0.35rem",
//                   background: "#f1f5f9",
//                   padding: "0.25rem",
//                   borderRadius: "9999px",
//                 }}
//               >
//                 {[
//                   { key: "all", label: "All" },
//                   { key: "principal", label: "🏛️ Principal" },
//                   { key: "interest", label: "📈 Interest" },
//                 ].map((tab) => (
//                   <button
//                     key={tab.key}
//                     onClick={() => handleTabChange(tab.key)}
//                     style={{
//                       padding: "0.4rem 1rem",
//                       borderRadius: "9999px",
//                       border: "none",
//                       fontSize: "0.8rem",
//                       fontWeight: 600,
//                       cursor: "pointer",
//                       transition: "all 0.2s ease",
//                       background:
//                         activeTab === tab.key ? "#ffffff" : "transparent",
//                       color: activeTab === tab.key ? "#1e293b" : "#64748b",
//                       boxShadow:
//                         activeTab === tab.key
//                           ? "0 1px 3px rgba(0,0,0,0.1)"
//                           : "none",
//                     }}
//                   >
//                     {tab.label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {filteredHistory.length > 0 ? (
//               <>
//                 <div className="table-scroll">
//                   <table
//                     className="data-table"
//                     style={{ width: "100%", borderCollapse: "collapse" }}
//                   >
//                     <thead>
//                       <tr
//                         style={{
//                           background: "#f8fafc",
//                           borderBottom: "1px solid #e2e8f0",
//                         }}
//                       >
//                         <th
//                           style={{
//                             textAlign: "left",
//                             padding: "1rem 1.5rem",
//                             fontSize: "0.8rem",
//                             fontWeight: 600,
//                             color: "#64748b",
//                           }}
//                         >
//                           Date
//                         </th>
//                         <th
//                           style={{
//                             textAlign: "left",
//                             padding: "1rem 1.5rem",
//                             fontSize: "0.8rem",
//                             fontWeight: 600,
//                             color: "#64748b",
//                           }}
//                         >
//                           Type
//                         </th>
//                         <th
//                           style={{
//                             textAlign: "left",
//                             padding: "1rem 1.5rem",
//                             fontSize: "0.8rem",
//                             fontWeight: 600,
//                             color: "#64748b",
//                           }}
//                         >
//                           Amount
//                         </th>
//                         <th
//                           style={{
//                             textAlign: "left",
//                             padding: "1rem 1.5rem",
//                             fontSize: "0.8rem",
//                             fontWeight: 600,
//                             color: "#64748b",
//                           }}
//                         >
//                           Details
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {paginatedHistory.map((tx) => (
//                         <tr
//                           key={tx._id}
//                           style={{ borderBottom: "1px solid #f1f5f9" }}
//                         >
//                           <td
//                             style={{
//                               padding: "1rem 1.5rem",
//                               fontSize: "0.88rem",
//                               color: "#334155",
//                             }}
//                           >
//                             {moment(tx.date).format("MMMM Do YYYY")}
//                           </td>
//                           <td style={{ padding: "1rem 1.5rem" }}>
//                             <TransactionBadge
//                               type={tx.type}
//                               paymentTarget={tx.paymentTarget}
//                             />
//                           </td>
//                           <td
//                             style={{
//                               padding: "1rem 1.5rem",
//                               fontSize: "0.9rem",
//                               fontWeight: 700,
//                               color:
//                                 tx.type === "repayment"
//                                   ? "#10b981"
//                                   : tx.type === "interest"
//                                     ? "#d97706"
//                                     : tx.type === "fine"
//                                       ? "#7c3aed"
//                                       : "var(--danger)",
//                             }}
//                           >
//                             {tx.type === "repayment" ? "−" : "+"}$
//                             {(tx.amount || 0).toFixed(2)}
//                           </td>
//                           <td
//                             style={{
//                               padding: "1rem 1.5rem",
//                               fontSize: "0.82rem",
//                               color: "#64748b",
//                               maxWidth: "320px",
//                               lineHeight: 1.4,
//                             }}
//                           >
//                             {tx.type === "interest" &&
//                             tx.interestPeriod?.periodStart ? (
//                               <span>
//                                 Period:{" "}
//                                 {moment(tx.interestPeriod.periodStart).format(
//                                   "MMM D",
//                                 )}{" "}
//                                 –{" "}
//                                 {moment(tx.interestPeriod.periodEnd).format(
//                                   "MMM D, YYYY",
//                                 )}
//                                 <br />
//                                 <span
//                                   style={{
//                                     color: "#94a3b8",
//                                     fontSize: "0.78rem",
//                                   }}
//                                 >
//                                   {(
//                                     (tx.interestPeriod.interestRate || 0.01) *
//                                     100
//                                   ).toFixed(1)}
//                                   % on $
//                                   {(
//                                     tx.interestPeriod.principalBalance || 0
//                                   ).toFixed(2)}
//                                 </span>
//                               </span>
//                             ) : (
//                               tx.note || "—"
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 <div
//                   style={{
//                     padding: "1rem 1.5rem",
//                     borderTop: "1px solid #e2e8f0",
//                   }}
//                 >
//                   <Pagination
//                     currentPage={currentPage}
//                     totalItems={filteredHistory.length}
//                     itemsPerPage={ITEMS_PER_PAGE}
//                     onPageChange={setCurrentPage}
//                   />
//                 </div>
//               </>
//             ) : (
//               <div
//                 style={{
//                   padding: "3rem 1.5rem",
//                   textAlign: "center",
//                   color: "#94a3b8",
//                 }}
//               >
//                 <span
//                   style={{
//                     fontSize: "2rem",
//                     display: "block",
//                     marginBottom: "0.5rem",
//                   }}
//                 >
//                   🔍
//                 </span>
//                 {activeTab === "all"
//                   ? "No transactions found."
//                   : `No ${activeTab} transactions found.`}
//               </div>
//             )}
//           </div>

//           {/* Information Footer */}
//           <div
//             className="card"
//             style={{
//               marginTop: "1.5rem",
//               padding: "1.25rem",
//               background: "#f8fafc",
//               border: "1px solid #e2e8f0",
//               borderRadius: "12px",
//               fontSize: "0.82rem",
//               color: "#475569",
//               lineHeight: 1.7,
//             }}
//           >
//             <strong
//               style={{
//                 color: "#1e293b",
//                 display: "block",
//                 marginBottom: "0.5rem",
//               }}
//             >
//               ℹ️ Terms & Settlement Protocol:
//             </strong>
//             <ul
//               style={{
//                 margin: 0,
//                 paddingLeft: "1.2rem",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "0.25rem",
//               }}
//             >
//               <li>
//                 The <strong>principal balance</strong> is lowered explicitly by
//                 target-specific principal repayments.
//               </li>
//               <li>
//                 Interest calculates at a flat{" "}
//                 <strong>1% of your current principal balance</strong> per 4-week
//                 iteration cycle.
//               </li>
//               <li>
//                 Incoming ledger adjustments are designated toward interest
//                 liabilities or principal reduction by account administrators.
//               </li>
//               <li>
//                 Balances modify directly upon validation and ledger confirmation
//                 of the clearing transaction.
//               </li>
//             </ul>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  History,
  Landmark,
  ListChecks,
  PiggyBank,
  Plus,
  ReceiptText,
  Send,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

// --- Mock Data ---
const memberSummary = {
  name: "Hana Mekonnen",
  savingBalance: 68500,
  shareBalance: 22000,
  existingLoanBalance: 38500,
  monthlyIncome: 18500,
};

const currentLoan = {
  id: "LN-2026-014",
  principal: 95000,
  balance: 38500,
  interestPaid: 8400,
  status: "Disbursed",
  nextPaymentDate: "2026-07-30",
  nextPaymentAmount: 5800,
  repaymentPeriod: 18,
  completedInstallments: 11,
  totalInstallments: 18,
};

const applicationStatuses = [
  { label: "Pending", count: 1 },
  { label: "Approved", count: 2 },
  { label: "Rejected", count: 1 },
  { label: "Queued", count: 1 },
  { label: "Disbursed", count: 3 },
  { label: "Completed", count: 4 },
];

const loanHistory = [
  {
    id: "LN-2026-014",
    requestedAmount: 95000,
    purpose: "Small business expansion",
    repaymentPeriod: 18,
    status: "Disbursed",
    remainingBalance: 38500,
    interestPaid: 8400,
    appliedDate: "2026-01-12",
  },
  {
    id: "LN-2025-032",
    requestedAmount: 55000,
    purpose: "Home improvement",
    repaymentPeriod: 12,
    status: "Completed",
    remainingBalance: 0,
    interestPaid: 5200,
    appliedDate: "2025-02-04",
  },
  {
    id: "LN-2024-018",
    requestedAmount: 42000,
    purpose: "Education support",
    repaymentPeriod: 10,
    status: "Completed",
    remainingBalance: 0,
    interestPaid: 3500,
    appliedDate: "2024-04-18",
  },
  {
    id: "LN-2026-021",
    requestedAmount: 125000,
    purpose: "Vehicle purchase",
    repaymentPeriod: 24,
    status: "Pending",
    remainingBalance: 0,
    interestPaid: 0,
    appliedDate: "2026-06-20",
  },
];

const repaymentSchedule = [
  {
    no: 1,
    dueDate: "2026-07-30",
    principal: 4150,
    interest: 1650,
    total: 5800,
    balance: 34350,
    status: "Upcoming",
  },
  {
    no: 2,
    dueDate: "2026-08-30",
    principal: 4330,
    interest: 1470,
    total: 5800,
    balance: 30020,
    status: "Upcoming",
  },
  {
    no: 3,
    dueDate: "2026-09-30",
    principal: 4510,
    interest: 1290,
    total: 5800,
    balance: 25510,
    status: "Upcoming",
  },
  {
    no: 4,
    dueDate: "2026-10-30",
    principal: 4700,
    interest: 1100,
    total: 5800,
    balance: 20810,
    status: "Upcoming",
  },
  {
    no: 5,
    dueDate: "2026-11-30",
    principal: 4890,
    interest: 910,
    total: 5800,
    balance: 15920,
    status: "Upcoming",
  },
  {
    no: 6,
    dueDate: "2026-12-30",
    principal: 5090,
    interest: 710,
    total: 5800,
    balance: 10830,
    status: "Upcoming",
  },
  {
    no: 7,
    dueDate: "2027-01-30",
    principal: 5300,
    interest: 500,
    total: 5800,
    balance: 5530,
    status: "Upcoming",
  },
  {
    no: 8,
    dueDate: "2027-02-28",
    principal: 5530,
    interest: 270,
    total: 5800,
    balance: 0,
    status: "Upcoming",
  },
];

const initialForm = {
  requestedAmount: "",
  purpose: "",
  repaymentPeriod: "12",
  guarantors: "",
  remarks: "",
  documents: null,
};

// --- Utilities ---
const currency = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Queued: "bg-sky-50 text-sky-700 border-sky-200",
  Disbursed: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatCurrency = (value) => currency.format(Number(value) || 0);

const calculateMonthlyPayment = (principal, months) => {
  const amount = Number(principal) || 0;
  const period = Number(months) || 1;
  const monthlyRate = 0.12 / 12;
  if (!amount) return 0;
  return (
    (amount * monthlyRate * Math.pow(1 + monthlyRate, period)) /
    (Math.pow(1 + monthlyRate, period) - 1)
  );
};

const downloadCsv = (rows, filename) => {
  const headers = [
    "No",
    "Due Date",
    "Principal",
    "Interest",
    "Total",
    "Balance",
    "Status",
  ];
  const csvRows = rows.map((row) => [
    row.no,
    row.dueDate,
    row.principal,
    row.interest,
    row.total,
    row.balance,
    row.status,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// --- Subcomponents ---
const StatCard = ({ icon: Icon, label, value, helper, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`rounded-lg p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </span>
      </div>
      {helper && <p className="mt-4 text-sm text-slate-500">{helper}</p>}
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Pending}`}
  >
    {status}
  </span>
);

const PreviewRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 bg-white">
    <div className="flex items-center gap-3">
      <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon size={17} />
      </span>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <span className="text-right text-sm font-bold text-slate-950">{value}</span>
  </div>
);

// Reusable Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-4xl",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl bg-slate-50 shadow-2xl border border-slate-200`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <Icon size={20} />
              </span>
            )}
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Main Component ---
const MyLoan = () => {
  const [form, setForm] = useState(initialForm);
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [message, setMessage] = useState("");

  // Modal State Control
  const [activeModal, setActiveModal] = useState(null); // 'application' | 'history' | 'schedule' | null

  const handleCloseModal = () => {
    setActiveModal(null);
    setMessage(""); // Clear message on close
  };

  const repaymentProgress =
    (currentLoan.completedInstallments / currentLoan.totalInstallments) * 100;

  const maximumLoanAmount = useMemo(() => {
    const baseEligibility =
      (memberSummary.savingBalance + memberSummary.shareBalance) * 2.5;
    return Math.max(baseEligibility - memberSummary.existingLoanBalance, 0);
  }, []);

  const requestedAmount = Number(form.requestedAmount) || 0;
  const estimatedMonthlyRepayment = calculateMonthlyPayment(
    requestedAmount,
    form.repaymentPeriod,
  );
  const eligibilityStatus =
    requestedAmount > 0 &&
    requestedAmount <= maximumLoanAmount &&
    estimatedMonthlyRepayment <= memberSummary.monthlyIncome * 0.45;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newApplication = {
      id: `APP-${Date.now()}`,
      requestedAmount,
      purpose: form.purpose,
      repaymentPeriod: Number(form.repaymentPeriod),
      guarantors: form.guarantors,
      remarks: form.remarks,
      documentName: form.documents?.name || "No document attached",
      status: eligibilityStatus ? "Pending" : "Queued",
      appliedDate: new Date().toISOString().slice(0, 10),
    };

    setSubmittedApplications((current) => [newApplication, ...current]);
    setForm(initialForm);
    setMessage(
      eligibilityStatus
        ? "Loan application submitted successfully and is pending review."
        : "Application saved to queue. A loan officer will review the eligibility details.",
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Member Loan Management
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              My Loans
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              View loan eligibility, repayment progress, and manage
              applications.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm text-slate-500">Member</p>
            <p className="font-bold text-slate-950">{memberSummary.name}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Actions Panel */}
        <section className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setActiveModal("application")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} /> New Loan Application
          </button>
          <button
            onClick={() => setActiveModal("history")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            <History size={18} /> View Loan History
          </button>
        </section>

        {/* Stats Grid */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Banknote}
            label="Current Loan Balance"
            value={formatCurrency(currentLoan.balance)}
            helper={`Loan ${currentLoan.id} is ${currentLoan.status.toLowerCase()}.`}
          />
          <StatCard
            icon={ShieldCheck}
            label="Available Eligibility"
            value={formatCurrency(maximumLoanAmount)}
            helper="Calculated from savings, shares, and existing balance."
            tone="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Maximum Loan Amount"
            value={formatCurrency(maximumLoanAmount)}
            helper="Subject to guarantor and committee approval."
            tone="amber"
          />
          <StatCard
            icon={Wallet}
            label="Remaining Balance"
            value={formatCurrency(currentLoan.balance)}
            helper={`${currentLoan.totalInstallments - currentLoan.completedInstallments} installments remaining.`}
            tone="slate"
          />
        </section>

        {/* Dashboard Panels */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Current Loan Progress */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Loan Dashboard
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Repayment progress for current active loan.
                </p>
              </div>
              <StatusBadge status={currentLoan.status} />
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Repayment progress
                </span>
                <span className="text-slate-500">
                  {currentLoan.completedInstallments}/
                  {currentLoan.totalInstallments}
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${repaymentProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-slate-500">Next payment</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {formatCurrency(currentLoan.nextPaymentAmount)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-slate-500">Next due date</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {currentLoan.nextPaymentDate}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-slate-500">Interest paid</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {formatCurrency(currentLoan.interestPaid)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal("schedule")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition"
              >
                <CalendarDays size={16} /> View Full Repayment Schedule
              </button>
            </div>
          </div>

          {/* Application Statuses */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ListChecks className="text-blue-700" size={20} />
              <h2 className="text-xl font-bold text-slate-950">
                Application Status
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {applicationStatuses.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <StatusBadge status={item.label} />
                  <span className="font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-900 border border-blue-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <p>
                  Applications move from pending review to approved, queued,
                  disbursed, rejected, or completed after officer processing.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Application Modal */}
      <Modal
        isOpen={activeModal === "application"}
        onClose={handleCloseModal}
        title="New Loan Application"
        icon={Plus}
        maxWidth="max-w-6xl"
      >
        <div className="grid gap-6 lg:grid-cols-5">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3"
          >
            <h3 className="text-lg font-bold text-slate-950">
              Application Form
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Complete all required fields before submitting your request.
            </p>

            {message && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                <span>{message}</span>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Requested loan amount
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.requestedAmount}
                  onChange={(event) =>
                    updateField("requestedAmount", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter amount"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Repayment period
                </span>
                <select
                  required
                  value={form.repaymentPeriod}
                  onChange={(event) =>
                    updateField("repaymentPeriod", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Loan purpose
                </span>
                <input
                  type="text"
                  required
                  value={form.purpose}
                  onChange={(event) =>
                    updateField("purpose", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Business, education, home improvement..."
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Guarantor(s)
                </span>
                <textarea
                  required
                  rows="3"
                  value={form.guarantors}
                  onChange={(event) =>
                    updateField("guarantors", event.target.value)
                  }
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter guarantor names, member IDs, or phone numbers"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Supporting documents
                </span>
                <div className="mt-2 flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:bg-slate-100 cursor-pointer">
                  <div>
                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                    <input
                      type="file"
                      onChange={(event) =>
                        updateField(
                          "documents",
                          event.target.files?.[0] || null,
                        )
                      }
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Optional PDF, image, or document.
                    </p>
                  </div>
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Additional remarks
                </span>
                <textarea
                  rows="2"
                  value={form.remarks}
                  onChange={(event) =>
                    updateField("remarks", event.target.value)
                  }
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Add any notes for the loan officer"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
            >
              <Send size={18} /> Submit Application
            </button>
          </form>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-6 lg:col-span-2 h-fit">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <ReceiptText className="text-blue-700" size={20} /> Pre-Submission
              Review
            </h3>

            <div className="mt-5 space-y-3">
              <PreviewRow
                icon={PiggyBank}
                label="Current saving balance"
                value={formatCurrency(memberSummary.savingBalance)}
              />
              <PreviewRow
                icon={Landmark}
                label="Current share balance"
                value={formatCurrency(memberSummary.shareBalance)}
              />
              <PreviewRow
                icon={Banknote}
                label="Existing loan balance"
                value={formatCurrency(memberSummary.existingLoanBalance)}
              />
              <PreviewRow
                icon={TrendingUp}
                label="Maximum allowable loan"
                value={formatCurrency(maximumLoanAmount)}
              />
              <PreviewRow
                icon={Clock3}
                label="Estimated monthly repayment"
                value={formatCurrency(estimatedMonthlyRepayment)}
              />
            </div>

            <div
              className={`mt-5 rounded-lg border p-4 shadow-sm ${eligibilityStatus ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
            >
              <div className="flex items-start gap-2">
                {eligibilityStatus ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                ) : (
                  <XCircle className="mt-0.5 shrink-0" size={18} />
                )}
                <div>
                  <p className="font-bold">Eligibility status</p>
                  <p className="mt-1 text-sm">
                    {eligibilityStatus
                      ? "Eligible for submission based on the selected amount and repayment period."
                      : "Enter an amount within the allowable limit and repayment capacity."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Modal>

      {/* 2. Repayment Schedule Modal */}
      <Modal
        isOpen={activeModal === "schedule"}
        onClose={handleCloseModal}
        title="Repayment Schedule"
        icon={CalendarDays}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            Detailed breakdown of upcoming and completed installments.
          </p>
          <button
            type="button"
            onClick={() =>
              downloadCsv(repaymentSchedule, "repayment-schedule.csv")
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {repaymentSchedule.map((item) => (
                  <tr
                    key={item.no}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {item.no}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.dueDate}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.principal)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.interest)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 3. Loan History Modal */}
      <Modal
        isOpen={activeModal === "history"}
        onClose={handleCloseModal}
        title="Complete Loan History"
        icon={History}
        maxWidth="max-w-5xl"
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Loan ID</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Interest paid</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {[...submittedApplications, ...loanHistory].map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">
                      {loan.id}
                    </td>
                    <td className="min-w-48 px-4 py-3 text-slate-600">
                      {loan.purpose}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatCurrency(loan.requestedAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {loan.repaymentPeriod} months
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatCurrency(loan.remainingBalance)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatCurrency(loan.interestPaid)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default MyLoan;

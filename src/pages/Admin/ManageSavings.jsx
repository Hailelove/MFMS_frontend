import React, { useCallback, useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import moment from "moment";
import { useForm } from "react-hook-form";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 12;

const ManageSavings = () => {
  // ============== Core State ==============
  const [users, setUsers] = useState([]);
  const [savingsOverview, setSavingsOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedUserStatus, setSelectedUserStatus] = useState("ACTIVE");
  const [userSavingsDetail, setUserSavingsDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ============== Filter State ==============
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("ALL");
  const [filterDateRange, setFilterDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  // ============== Settings & Configuration ==============
  const [minimumSavingAmount, setMinimumSavingAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [interestCalculationMethod, setInterestCalculationMethod] =
    useState("COMPOUND_MONTHLY");

  // ============== Bulk Operations State ==============
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [bulkOperationType, setBulkOperationType] = useState("MONTHLY_SAVINGS"); // MONTHLY_SAVINGS, INTEREST_CALCULATION, RECONCILIATION
  const [bulkSelectedMembers, setBulkSelectedMembers] = useState([]);
  const [bulkBatchAmount, setBulkBatchAmount] = useState("");
  const [bulkBatchDate, setBulkBatchDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [bulkBatchMethod, setBulkBatchMethod] = useState("CASH");
  const [bulkBatchRemarks, setBulkBatchRemarks] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkAllSelected, setBulkAllSelected] = useState(false);

  // ============== Monthly Reconciliation State ==============
  const [reconciliationMonth, setReconciliationMonth] = useState(
    moment().format("YYYY-MM"),
  );
  const [reconciliationData, setReconciliationData] = useState(null);
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [reconciliationProcessing, setReconciliationProcessing] =
    useState(false);

  // ============== Payment Method Options ==============
  const paymentMethodOptions = [
    { value: "CASH", label: "Cash" },
    { value: "BANK", label: "Bank Deposit" },
    { value: "PAYROLL", label: "Payroll Deduction" },
  ];

  // ============== Saving Category Options ==============
  const savingCategoryOptions = [
    { value: "INITIAL_SAVING", label: "Initial Saving" },
    { value: "MONTHLY_SAVING", label: "Monthly Saving (መደበኛ ቁጠባ)" },
    {
      value: "IRREGULAR_SAVING",
      label: "Additional/Irregular Saving (ኢ-መደበኛ ቁጠባ)",
    },
    { value: "CHILDREN_SAVING", label: "Children Saving (የልጆች ቁጠባ)" },
    { value: "ORGANIZATION_SAVING", label: "Organization Saving (የደርጅቶች ቁጠባ)" },
    { value: "WITHDRAWAL", label: "Withdrawal" },
    { value: "ADJUSTMENT", label: "Adjustment" },
  ];

  // ============== Interest Calculation Methods (Constants) ==============
  const INTEREST_CALCULATION_METHODS = {
    SIMPLE: { value: "SIMPLE", label: "Simple Interest (P × R × T)" },
    COMPOUND_MONTHLY: { value: "COMPOUND_MONTHLY", label: "Compound Monthly" },
    COMPOUND_QUARTERLY: {
      value: "COMPOUND_QUARTERLY",
      label: "Compound Quarterly",
    },
    COMPOUND_ANNUALLY: {
      value: "COMPOUND_ANNUALLY",
      label: "Compound Annually",
    },
  };

  // ============== Utility Functions ==============
  const getSavingType = (category) => {
    if (category === "WITHDRAWAL") return "WITHDRAWAL";
    if (category === "ADJUSTMENT") return "ADJUSTMENT";
    return "DEPOSIT";
  };

  const calculateCategorySavings = useCallback((savings) => {
    const categories = {
      INITIAL_SAVING: 0,
      MONTHLY_SAVING: 0,
      IRREGULAR_SAVING: 0,
      CHILDREN_SAVING: 0,
      ORGANIZATION_SAVING: 0,
      TOTAL_DEPOSITS: 0,
      TOTAL_WITHDRAWALS: 0,
      TOTAL_ADJUSTMENTS: 0,
    };

    if (!Array.isArray(savings)) return categories;

    savings.forEach((record) => {
      const amount = parseFloat(record.amount) || 0;

      if (
        record.category === "INITIAL_SAVING" ||
        record.category === "MONTHLY_SAVING" ||
        record.category === "IRREGULAR_SAVING" ||
        record.category === "CHILDREN_SAVING" ||
        record.category === "ORGANIZATION_SAVING"
      ) {
        if (record.type === "DEPOSIT") {
          categories[record.category] += amount;
          categories.TOTAL_DEPOSITS += amount;
        }
      }

      if (record.type === "WITHDRAWAL") {
        categories.TOTAL_WITHDRAWALS += amount;
      }

      if (record.type === "ADJUSTMENT") {
        categories.TOTAL_ADJUSTMENTS += amount;
      }
    });

    return categories;
  }, []);

  // ============== INTEREST CALCULATION FORMULAS ==============

  const calculateSimpleInterest = useCallback((principal, rate, months) => {
    if (rate <= 0) return 0;
    const timeInYears = months / 12;
    const rateDecimal = rate / 100;
    const interest = principal * rateDecimal * timeInYears;
    return interest;
  }, []);

  const calculateCompoundMonthlyInterest = useCallback(
    (principal, rate, months) => {
      if (rate <= 0) return 0;
      const rateDecimal = rate / 100;
      const timeInYears = months / 12;
      const compoundingPerYear = 12;
      const amount =
        principal *
        Math.pow(
          1 + rateDecimal / compoundingPerYear,
          compoundingPerYear * timeInYears,
        );
      const interest = amount - principal;
      return Math.max(0, interest);
    },
    [],
  );

  const calculateCompoundQuarterlyInterest = useCallback(
    (principal, rate, months) => {
      if (rate <= 0) return 0;
      const rateDecimal = rate / 100;
      const timeInYears = months / 12;
      const compoundingPerYear = 4;
      const amount =
        principal *
        Math.pow(
          1 + rateDecimal / compoundingPerYear,
          compoundingPerYear * timeInYears,
        );
      const interest = amount - principal;
      return Math.max(0, interest);
    },
    [],
  );

  const calculateCompoundAnnuallyInterest = useCallback(
    (principal, rate, months) => {
      if (rate <= 0) return 0;
      const rateDecimal = rate / 100;
      const timeInYears = months / 12;
      const compoundingPerYear = 1;
      const amount =
        principal *
        Math.pow(
          1 + rateDecimal / compoundingPerYear,
          compoundingPerYear * timeInYears,
        );
      const interest = amount - principal;
      return Math.max(0, interest);
    },
    [],
  );

  const calculateAccumulatedInterest = useCallback(
    (savings, rate, method) => {
      if (!Array.isArray(savings) || !rate || rate === 0) return 0;

      let totalInterest = 0;
      const sortedSavings = [...savings].sort(
        (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
      );

      let balance = 0;
      let lastDate = null;

      sortedSavings.forEach((record) => {
        const currentAmount = parseFloat(record.amount) || 0;
        const recordDate = new Date(record.transactionDate);

        if (lastDate && balance > 0) {
          const monthsDiff =
            (recordDate.getFullYear() - lastDate.getFullYear()) * 12 +
            (recordDate.getMonth() - lastDate.getMonth());

          if (monthsDiff > 0) {
            let periodInterest = 0;

            switch (method) {
              case "SIMPLE":
                periodInterest = calculateSimpleInterest(
                  balance,
                  rate,
                  monthsDiff,
                );
                break;
              case "COMPOUND_MONTHLY":
                periodInterest = calculateCompoundMonthlyInterest(
                  balance,
                  rate,
                  monthsDiff,
                );
                break;
              case "COMPOUND_QUARTERLY":
                periodInterest = calculateCompoundQuarterlyInterest(
                  balance,
                  rate,
                  monthsDiff,
                );
                break;
              case "COMPOUND_ANNUALLY":
                periodInterest = calculateCompoundAnnuallyInterest(
                  balance,
                  rate,
                  monthsDiff,
                );
                break;
              default:
                periodInterest = calculateCompoundMonthlyInterest(
                  balance,
                  rate,
                  monthsDiff,
                );
            }

            totalInterest += periodInterest;
          }
        }

        if (record.type === "DEPOSIT") {
          balance += currentAmount;
        } else if (record.type === "WITHDRAWAL") {
          balance -= currentAmount;
        }

        lastDate = recordDate;
      });

      if (lastDate && balance > 0) {
        const today = new Date();
        const monthsDiff =
          (today.getFullYear() - lastDate.getFullYear()) * 12 +
          (today.getMonth() - lastDate.getMonth());

        if (monthsDiff > 0) {
          let finalPeriodInterest = 0;

          switch (method) {
            case "SIMPLE":
              finalPeriodInterest = calculateSimpleInterest(
                balance,
                rate,
                monthsDiff,
              );
              break;
            case "COMPOUND_MONTHLY":
              finalPeriodInterest = calculateCompoundMonthlyInterest(
                balance,
                rate,
                monthsDiff,
              );
              break;
            case "COMPOUND_QUARTERLY":
              finalPeriodInterest = calculateCompoundQuarterlyInterest(
                balance,
                rate,
                monthsDiff,
              );
              break;
            case "COMPOUND_ANNUALLY":
              finalPeriodInterest = calculateCompoundAnnuallyInterest(
                balance,
                rate,
                monthsDiff,
              );
              break;
            default:
              finalPeriodInterest = calculateCompoundMonthlyInterest(
                balance,
                rate,
                monthsDiff,
              );
          }

          totalInterest += finalPeriodInterest;
        }
      }

      return Math.max(0, totalInterest);
    },
    [
      calculateSimpleInterest,
      calculateCompoundMonthlyInterest,
      calculateCompoundQuarterlyInterest,
      calculateCompoundAnnuallyInterest,
    ],
  );

  // ============== Form Setup ==============
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: "MONTHLY_SAVING",
      transactionDate: moment().format("YYYY-MM-DD"),
      paymentMethod: "CASH",
      amount: "",
      payrollMonth: "",
      referenceNo: "",
      remarks: "",
    },
  });

  const [submitLoading, setSubmitLoading] = useState(false);

  const paymentMethod = watch("paymentMethod");
  const category = watch("category");

  // ============== Delete/Correction Modal State ==============
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ============== Pagination State ==============
  const [overviewPage, setOverviewPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // ============== API Calls ==============
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      // 2. Safely parse through common pagination structures
      let membersList = [];

      if (Array.isArray(res.data)) {
        membersList = res.data;
      } else if (Array.isArray(res.data?.members)) {
        // 👈 Common Prisma pattern
        membersList = res.data.members;
      } else if (Array.isArray(res.data?.users)) {
        membersList = res.data.users;
      } else if (Array.isArray(res.data?.data)) {
        membersList = res.data.data;
      } else if (Array.isArray(res.data?.data?.members)) {
        membersList = res.data.data.members;
      }

      setUsers(membersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load members");
      setUsers([]);
    }
  }, []);

  const fetchSavingsOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/savings");
      const savingsList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setSavingsOverview(savingsList);
    } catch (error) {
      console.error("Error fetching savings overview:", error);
      toast.error(
        "Failed to load overview: " +
          (error.response?.data?.message || error.message),
      );
      setSavingsOverview([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get("/admin/settings/saving");
      setMinimumSavingAmount(response.data?.minimumSavingAmount || 100);
      setInterestRate(response.data?.interestRate || 0);
      setInterestCalculationMethod(
        response.data?.interestCalculationMethod || "COMPOUND_MONTHLY",
      );
    } catch (err) {
      console.error("Error fetching settings:", err);
      setMinimumSavingAmount(100);
      setInterestRate(0);
      setInterestCalculationMethod("COMPOUND_MONTHLY");
    }
  }, []);

  useEffect(() => {
    fetchSavingsOverview();
    fetchUsers();
    fetchSettings();
  }, [fetchSavingsOverview, fetchUsers, fetchSettings]);

  // ============== User Detail Opening ==============
  const openUserDetail = async (userId, name, status) => {
    if (userId === undefined || userId === null) {
      console.error("CRITICAL: userId is undefined!");
      toast.error("Cannot manage account: User ID not found.");
      return;
    }

    if (status !== "ACTIVE") {
      toast.warning("Only active members can make saving transactions.");
      return;
    }

    setSelectedUserId(userId);
    setSelectedUserName(name);
    setSelectedUserStatus(status);
    setDetailLoading(true);
    setUserSavingsDetail(null);
    setHistoryPage(1);
    setShowOverdueOnly(false);
    setFilterCategory("ALL");
    setFilterPaymentMethod("ALL");
    setFilterDateRange({ startDate: null, endDate: null });
    setSearchTerm("");

    try {
      const response = await api.get(`/admin/member-finance/${userId}`);
      setUserSavingsDetail(response.data);
    } catch (error) {
      console.error("Error loading financial details:", error);
      toast.error(
        "Failed to load financial details: " +
          (error.response?.data?.message || error.message),
      );
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ============== Transaction Submission (Individual) ==============
  const onSubmitPayment = async (data) => {
    if (selectedUserStatus !== "ACTIVE") {
      toast.error("Only active members can make saving transactions.");
      return;
    }

    if (
      data.category === "MONTHLY_SAVING" &&
      Number(data.amount) < minimumSavingAmount
    ) {
      toast.error(
        `Monthly saving contributions cannot be less than ETB ${minimumSavingAmount}`,
      );
      return;
    }

    setSubmitLoading(true);

    try {
      const payload = {
        category: data.category,
        type: getSavingType(data.category),
        amount: Number(data.amount),
        transactionDate: data.transactionDate,
        paymentMethod: data.paymentMethod,
        referenceNo: data.referenceNo?.trim() || null,
        remarks: data.remarks?.trim() || null,
        isInitialTransaction: data.category === "INITIAL_SAVING",
      };

      if (data.paymentMethod === "PAYROLL" && data.payrollMonth) {
        payload.payrollMonth = `${data.payrollMonth}-01`;
      }

      const endpoint = `/admin/savings/${selectedUserId}/transaction`;

      await api.post(endpoint, payload);

      toast.success("Saving transaction recorded successfully");

      reset({
        category: "MONTHLY_SAVING",
        transactionDate: moment().format("YYYY-MM-DD"),
        paymentMethod: "CASH",
        amount: "",
        payrollMonth: "",
        referenceNo: "",
        remarks: "",
      });

      await openUserDetail(
        selectedUserId,
        selectedUserName,
        selectedUserStatus,
      );
      await fetchSavingsOverview();
    } catch (error) {
      console.error("Error recording transaction:", error);
      toast.error(
        error.response?.data?.message || "Failed to record transaction",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ============== Bulk Operations ==============

  const getActiveMembers = useCallback(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    return safeUsers.filter(
      (u) => u.status === "ACTIVE" || u.status === undefined,
    );
  }, [users]);

  const handleBulkMemberToggle = (userId) => {
    setBulkSelectedMembers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleBulkSelectAll = () => {
    const activeMembers = getActiveMembers();
    if (bulkAllSelected) {
      setBulkSelectedMembers([]);
      setBulkAllSelected(false);
    } else {
      setBulkSelectedMembers(activeMembers.map((m) => m.id || m.memberId));
      setBulkAllSelected(true);
    }
  };

  const generateBulkPreview = () => {
    const activeMembers = getActiveMembers();
    const selectedMembersData = activeMembers.filter((m) =>
      bulkSelectedMembers.includes(m.id || m.memberId),
    );

    let totalAmount = 0;

    if (bulkOperationType === "MONTHLY_SAVINGS") {
      const amount = parseFloat(bulkBatchAmount) || 0;
      totalAmount = amount * selectedMembersData.length;
    } else if (bulkOperationType === "INTEREST_CALCULATION") {
      selectedMembersData.forEach((member) => {
        const memberSavings = savingsOverview.find(
          (s) => String(s.memberId) === String(member.id || member.memberId),
        );
        if (memberSavings) {
          const interest = calculateAccumulatedInterest(
            memberSavings.savings || [],
            interestRate,
            interestCalculationMethod,
          );
          totalAmount += interest;
        }
      });
    }

    setBulkPreview({
      memberCount: selectedMembersData.length,
      members: selectedMembersData,
      totalAmount,
      operationType: bulkOperationType,
      date: bulkBatchDate,
      method: bulkBatchMethod,
    });
  };

  const processBulkOperation = async () => {
    if (bulkSelectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    if (bulkOperationType === "MONTHLY_SAVINGS") {
      if (!bulkBatchAmount || parseFloat(bulkBatchAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (parseFloat(bulkBatchAmount) < minimumSavingAmount) {
        toast.error(
          `Amount cannot be less than minimum saving amount: ETB ${minimumSavingAmount}`,
        );
        return;
      }
    }

    setBulkProcessing(true);

    try {
      const activeMembers = getActiveMembers();
      const selectedMembers = activeMembers.filter((m) =>
        bulkSelectedMembers.includes(m.id || m.memberId),
      );

      if (bulkOperationType === "MONTHLY_SAVINGS") {
        const payload = {
          memberIds: selectedMembers.map((m) => m.id || m.memberId),
          category: "MONTHLY_SAVING",
          type: "DEPOSIT",
          amount: parseFloat(bulkBatchAmount),
          transactionDate: bulkBatchDate,
          paymentMethod: bulkBatchMethod,
          remarks:
            bulkBatchRemarks ||
            `Bulk monthly saving batch - ${moment().format("YYYY-MM-DD HH:mm")}`,
        };

        await api.post("/admin/savings/bulk/monthly-savings", payload);
        toast.success(
          `Monthly savings posted for ${selectedMembers.length} members`,
        );
      } else if (bulkOperationType === "INTEREST_CALCULATION") {
        const payload = {
          memberIds: selectedMembers.map((m) => m.id || m.memberId),
          interestRate,
          interestCalculationMethod,
          transactionDate: bulkBatchDate,
        };

        await api.post("/admin/savings/bulk/calculate-interest", payload);
        toast.success(
          `Interest calculated and posted for ${selectedMembers.length} members`,
        );
      }

      // Reset bulk operations
      setBulkSelectedMembers([]);
      setBulkAllSelected(false);
      setBulkBatchAmount("");
      setBulkBatchRemarks("");
      setBulkPreview(null);

      // Refresh data
      await fetchSavingsOverview();
      await fetchUsers();
    } catch (error) {
      console.error("Error processing bulk operation:", error);
      toast.error(
        error.response?.data?.message || "Failed to process bulk operation",
      );
    } finally {
      setBulkProcessing(false);
    }
  };

  // ============== Monthly Reconciliation ==============

  const fetchReconciliationData = async () => {
    try {
      setReconciliationProcessing(true);
      const response = await api.get("/admin/savings/reconciliation", {
        params: {
          month: reconciliationMonth,
        },
      });

      setReconciliationData(response.data);
      setShowReconciliation(true);
    } catch (error) {
      console.error("Error fetching reconciliation data:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch reconciliation data",
      );
    } finally {
      setReconciliationProcessing(false);
    }
  };

  const processReconciliation = async () => {
    try {
      setReconciliationProcessing(true);
      const payload = {
        month: reconciliationMonth,
        reconciliationData,
      };

      await api.post("/admin/savings/reconciliation/process", payload);
      toast.success("Monthly reconciliation completed successfully");

      // Refresh data
      await fetchSavingsOverview();
      setShowReconciliation(false);
      setReconciliationData(null);
    } catch (error) {
      console.error("Error processing reconciliation:", error);
      toast.error(
        error.response?.data?.message || "Failed to process reconciliation",
      );
    } finally {
      setReconciliationProcessing(false);
    }
  };

  // ============== Correction/Delete Handlers ==============
  const openDeleteModal = (record) => {
    setDeleteModal({ record });
    setDeleteReason("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(null);
    setDeleteReason("");
  };

  const handleDeleteRecord = async () => {
    if (!deleteModal || deleting) return;
    const { record } = deleteModal;
    setDeleting(true);

    try {
      const endpoint = `/admin/savings/${selectedUserId}/transaction/${record.id}`;

      await api.delete(endpoint, {
        data: { adjustmentReason: deleteReason.trim() || "Manual correction" },
      });

      toast.info(
        "Transaction corrected through adjustment entry. Original record preserved in audit log.",
      );
      setDeleteModal(null);
      setDeleteReason("");

      await openUserDetail(
        selectedUserId,
        selectedUserName,
        selectedUserStatus,
      );
      await fetchSavingsOverview();
    } catch (error) {
      console.error("Error correcting transaction:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to process correction. All transactions are immutable after posting.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const goBack = () => {
    setSelectedUserId(null);
    setUserSavingsDetail(null);
    setOverviewPage(1);
  };

  // ============== Computed Data ==============
  const safeUsers = Array.isArray(users) ? users : [];

  const allMembers = safeUsers.map((u) => {
    const memberId = u.id || u.memberId;
    const fullName = u.fullName || u.name || "Unnamed Member";
    const status = u.status || "ACTIVE";

    const savRow = savingsOverview.find(
      (s) =>
        String(s.memberId) === String(memberId) ||
        String(s.id) === String(memberId) ||
        String(s.userId) === String(u.userId),
    );

    return (
      savRow || {
        id: memberId,
        memberId,
        userId: u.userId,
        fullName,
        email: u.email,
        status,
        totalSavings: u.memberBalance?.savingBalance || 0,
        lastTransaction: null,
        overdueMonths: u.overdueMonths || 0,
      }
    );
  });

  const filteredMembers = showOverdueOnly
    ? allMembers.filter((m) => m.overdueMonths > 0)
    : allMembers;

  const searchFilteredMembers = filteredMembers.filter(
    (m) =>
      !searchTerm ||
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const paginatedMembers = searchFilteredMembers.slice(
    (overviewPage - 1) * ITEMS_PER_PAGE,
    overviewPage * ITEMS_PER_PAGE,
  );

  const activeRecords = userSavingsDetail?.savings || [];

  const filteredRecords = useMemo(() => {
    return activeRecords.filter((record) => {
      let passes = true;

      if (filterCategory !== "ALL" && record.category !== filterCategory) {
        passes = false;
      }

      if (
        filterPaymentMethod !== "ALL" &&
        record.paymentMethod !== filterPaymentMethod
      ) {
        passes = false;
      }

      if (
        filterDateRange.startDate &&
        new Date(record.transactionDate) < new Date(filterDateRange.startDate)
      ) {
        passes = false;
      }

      if (
        filterDateRange.endDate &&
        new Date(record.transactionDate) > new Date(filterDateRange.endDate)
      ) {
        passes = false;
      }

      return passes;
    });
  }, [activeRecords, filterCategory, filterPaymentMethod, filterDateRange]);

  const paginatedRecords = filteredRecords.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE,
  );

  const categorySavings = useMemo(() => {
    return calculateCategorySavings(userSavingsDetail?.savings || []);
  }, [userSavingsDetail, calculateCategorySavings]);

  const accumulatedInterest = useMemo(() => {
    return calculateAccumulatedInterest(
      userSavingsDetail?.savings || [],
      interestRate,
      interestCalculationMethod,
    );
  }, [
    userSavingsDetail,
    interestRate,
    interestCalculationMethod,
    calculateAccumulatedInterest,
  ]);

  const totalWithInterest = useMemo(() => {
    return (userSavingsDetail?.totalSavings || 0) + accumulatedInterest;
  }, [userSavingsDetail, accumulatedInterest]);

  // ============== Utility Functions for Display ==============
  const getCategoryBadgeColor = (category) => {
    const colors = {
      INITIAL_SAVING: "bg-purple-100 text-purple-700 border-purple-300",
      MONTHLY_SAVING: "bg-blue-100 text-blue-700 border-blue-300",
      IRREGULAR_SAVING: "bg-orange-100 text-orange-700 border-orange-300",
      CHILDREN_SAVING: "bg-pink-100 text-pink-700 border-pink-300",
      ORGANIZATION_SAVING: "bg-teal-100 text-teal-700 border-teal-300",
      WITHDRAWAL: "bg-red-100 text-red-700 border-red-300",
      ADJUSTMENT: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return colors[category] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  const getTransactionTypeBadgeColor = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "bg-green-100 text-green-700 border-green-300";
      case "WITHDRAWAL":
        return "bg-red-100 text-red-700 border-red-300";
      case "ADJUSTMENT":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getMemberStatusBadge = (status) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-700 border-green-300",
      INACTIVE: "bg-red-100 text-red-700 border-red-300",
      SUSPENDED: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  // ============== Export Function ==============
  const exportSavingsHistory = () => {
    if (!userSavingsDetail?.savings || userSavingsDetail.savings.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = [
      "Date",
      "Category",
      "Type",
      "Method",
      "Reference",
      "Amount",
      "Remarks",
    ];
    const rows = activeRecords.map((record) => [
      moment(record.transactionDate).format("MMM DD, YYYY"),
      record.category,
      record.type,
      record.paymentMethod,
      record.referenceNo || "—",
      record.amount,
      record.remarks || "—",
    ]);

    const csv = [
      [`Savings History - ${selectedUserName}`],
      [`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`],
      [`Interest Rate: ${interestRate}% (${interestCalculationMethod})`],
      [],
      headers,
      ...rows,
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `savings_${selectedUserName}_${moment().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Savings history exported successfully");
  };

  // ============== RENDER ==============
  if (loading)
    return (
      <div className="flex justify-center items-center h-96 bg-white rounded-2xl border border-slate-200">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 border-r-transparent animate-spin"></div>
        </div>
      </div>
    );

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white min-h-screen text-slate-800 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
      {/* ============== Header Panel ============== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            💰 Cooperative Savings Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {selectedUserId
              ? `Financial timeline for ${selectedUserName}`
              : "Manage member savings, contributions, withdrawals, and interest calculations with complete audit trail."}
          </p>
        </div>
        {!selectedUserId && (
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setShowBulkOperations(!showBulkOperations)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-sm font-medium transition-all shadow-md"
            >
              ⚙️ Bulk Operations
            </button>
            <button
              onClick={fetchReconciliationData}
              disabled={reconciliationProcessing}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white py-2 px-4 rounded-xl text-sm font-medium transition-all shadow-md"
            >
              📊 Monthly Reconciliation
            </button>
          </div>
        )}
        {selectedUserId && (
          <button
            className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm self-start sm:self-auto group"
            onClick={goBack}
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Directory</span>
          </button>
        )}
      </div>

      {/* ============== Bulk Operations Panel ============== */}
      {showBulkOperations && !selectedUserId && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-blue-900">
              ⚙️ Bulk Operations
            </h3>
            <button
              onClick={() => setShowBulkOperations(false)}
              className="text-blue-600 hover:text-blue-800 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Operation Type Selection */}
            <div className="space-y-4 lg:col-span-3">
              <div className="flex gap-3">
                {[
                  {
                    value: "MONTHLY_SAVINGS",
                    label: "📅 Batch Monthly Savings",
                  },
                  {
                    value: "INTEREST_CALCULATION",
                    label: "💰 Bulk Interest Calculation",
                  },
                ].map((op) => (
                  <button
                    key={op.value}
                    onClick={() => {
                      setBulkOperationType(op.value);
                      setBulkSelectedMembers([]);
                      setBulkAllSelected(false);
                      setBulkPreview(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      bulkOperationType === op.value
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Member Selection */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">
                  Select Members ({bulkSelectedMembers.length} selected)
                </label>
                <button
                  onClick={handleBulkSelectAll}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  {bulkAllSelected ? "Deselect All" : "Select All Active"}
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto bg-white border border-blue-200 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {getActiveMembers().map((member) => (
                    <label
                      key={member.id || member.memberId}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelectedMembers.includes(
                          member.id || member.memberId,
                        )}
                        onChange={() =>
                          handleBulkMemberToggle(member.id || member.memberId)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {member.fullName || member.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Operation Parameters */}
            {bulkOperationType === "MONTHLY_SAVINGS" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Amount (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkBatchAmount}
                    onChange={(e) => setBulkBatchAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-slate-500">
                    Minimum: ETB {minimumSavingAmount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Payment Method
                  </label>
                  <select
                    value={bulkBatchMethod}
                    onChange={(e) => setBulkBatchMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {paymentMethodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={bulkBatchDate}
                    onChange={(e) => setBulkBatchDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </>
            )}

            {bulkOperationType === "INTEREST_CALCULATION" && (
              <div className="space-y-2 lg:col-span-3">
                <label className="text-sm font-bold text-slate-700">
                  Interest Posting Date
                </label>
                <input
                  type="date"
                  value={bulkBatchDate}
                  onChange={(e) => setBulkBatchDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-600">
                  Interest Rate: {interestRate}% ({interestCalculationMethod})
                </p>
              </div>
            )}

            {/* Remarks */}
            <div className="lg:col-span-3 space-y-2">
              <label className="text-sm font-bold text-slate-700">
                Remarks (Optional)
              </label>
              <textarea
                value={bulkBatchRemarks}
                onChange={(e) => setBulkBatchRemarks(e.target.value)}
                placeholder="Add notes for this bulk operation..."
                rows="2"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {/* Preview & Action Buttons */}
            <div className="lg:col-span-3 flex gap-3">
              <button
                onClick={generateBulkPreview}
                disabled={
                  bulkSelectedMembers.length === 0 ||
                  (bulkOperationType === "MONTHLY_SAVINGS" && !bulkBatchAmount)
                }
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm transition-all"
              >
                👁️ Preview
              </button>
              <button
                onClick={processBulkOperation}
                disabled={bulkProcessing || !bulkPreview}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-semibold text-sm transition-all"
              >
                {bulkProcessing ? "Processing..." : "✓ Process"}
              </button>
            </div>
          </div>

          {/* Bulk Preview */}
          {bulkPreview && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h4 className="font-bold text-blue-900 mb-4">Preview Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-slate-600">Members</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {bulkPreview.memberCount}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-slate-600">Total Amount</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ETB {bulkPreview.totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-slate-600">Operation</div>
                  <div className="text-sm font-bold">
                    {bulkPreview.operationType.replace(/_/g, " ")}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-slate-600">Date</div>
                  <div className="text-sm font-bold">
                    {moment(bulkPreview.date).format("MMM DD, YYYY")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============== Reconciliation Panel ============== */}
      {showReconciliation && reconciliationData && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-6 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-purple-900">
              📊 Monthly Reconciliation -{" "}
              {moment(reconciliationMonth).format("MMMM YYYY")}
            </h3>
            <button
              onClick={() => setShowReconciliation(false)}
              className="text-purple-600 hover:text-purple-800 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="text-xs font-bold text-slate-600">
                Total Members
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {reconciliationData.totalMembers || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="text-xs font-bold text-slate-600">
                Total Savings
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                ETB {(reconciliationData.totalSavings || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="text-xs font-bold text-slate-600">
                Total Deposits
              </div>
              <div className="text-2xl font-bold text-blue-600">
                ETB {(reconciliationData.totalDeposits || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="text-xs font-bold text-slate-600">
                Total Interest
              </div>
              <div className="text-2xl font-bold text-green-600">
                ETB {(reconciliationData.totalInterest || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2">Member</th>
                  <th className="text-right py-2 px-2">Savings</th>
                  <th className="text-right py-2 px-2">Interest</th>
                  <th className="text-right py-2 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationData.memberDetails &&
                  reconciliationData.memberDetails.map((member, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-2 px-2 font-medium">
                        {member.memberName}
                      </td>
                      <td className="text-right py-2 px-2">
                        ETB {(member.savings || 0).toFixed(2)}
                      </td>
                      <td className="text-right py-2 px-2 text-green-600">
                        ETB {(member.interest || 0).toFixed(2)}
                      </td>
                      <td className="text-right py-2 px-2 font-bold">
                        ETB{" "}
                        {(
                          (member.savings || 0) + (member.interest || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={processReconciliation}
            disabled={reconciliationProcessing}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg font-bold transition-all"
          >
            {reconciliationProcessing
              ? "Processing..."
              : "✓ Confirm & Process Reconciliation"}
          </button>
        </div>
      )}

      {/* ============== Overview/Directory View ============== */}
      {!selectedUserId ? (
        <>
          {allMembers.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
              <p className="text-slate-500 text-sm">
                No members found. Add members via Registration first.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter & Search Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setOverviewPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    setShowOverdueOnly(!showOverdueOnly);
                    setOverviewPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    showOverdueOnly
                      ? "bg-red-600 text-white border-red-700 shadow-md"
                      : "bg-white border-slate-300 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {showOverdueOnly ? "✓ Show Overdue" : "Show Overdue/Missed"}
                </button>

                <div className="col-span-1 md:col-span-2 lg:col-span-2 flex items-center justify-end gap-2">
                  <span className="text-xs text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-lg border border-slate-200">
                    📊 {searchFilteredMembers.length} of {allMembers.length}{" "}
                    members
                  </span>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-50 to-blue-50 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Member</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Total Savings</th>
                        <th className="px-6 py-4">Overdue Months</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedMembers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center">
                            <p className="text-slate-400 text-sm">
                              No members found matching your search
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedMembers.map((member) => (
                          <tr
                            key={member.memberId || member.id}
                            className="hover:bg-slate-50/60 transition-colors duration-200 group"
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                {member.fullName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {member.email}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getMemberStatusBadge(
                                  member.status,
                                )}`}
                              >
                                {member.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-emerald-600 font-mono text-lg">
                              ETB {(member.totalSavings || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              {member.overdueMonths > 0 ? (
                                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-full text-xs font-bold">
                                  {member.overdueMonths} month(s)
                                </span>
                              ) : (
                                <span className="text-xs text-green-600 font-semibold">
                                  ✓ Current
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                className={`border rounded-xl text-xs font-semibold shadow-sm transition-all duration-300 py-1.5 px-4 ${
                                  member.status === "ACTIVE"
                                    ? "bg-white border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-700"
                                    : "bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
                                }`}
                                onClick={() =>
                                  member.status === "ACTIVE" &&
                                  openUserDetail(
                                    member.memberId || member.id,
                                    member.fullName,
                                    member.status,
                                  )
                                }
                                disabled={member.status !== "ACTIVE"}
                              >
                                {member.status === "ACTIVE"
                                  ? "Manage Account"
                                  : "Inactive"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                  <Pagination
                    currentPage={overviewPage}
                    totalItems={searchFilteredMembers.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setOverviewPage}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ============== Detail View ============== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ============== Main Content Area ============== */}
          <div className="lg:col-span-2 space-y-6">
            {detailLoading ? (
              <div className="flex justify-center items-center h-48 bg-white border border-slate-200 rounded-2xl">
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin"></div>
              </div>
            ) : userSavingsDetail ? (
              <>
                {/* ============== Summary Cards Grid ============== */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-4 rounded-xl shadow-sm">
                    <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                      Current Balance
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-900 font-mono">
                      ETB {(userSavingsDetail.totalSavings || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      Total deposited funds
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-xl shadow-sm">
                    <div className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
                      Total Deposits
                    </div>
                    <div className="text-2xl font-extrabold text-blue-900 font-mono">
                      ETB {categorySavings.TOTAL_DEPOSITS.toFixed(2)}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      All contributions
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 rounded-xl shadow-sm">
                    <div className="text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
                      Monthly Savings
                    </div>
                    <div className="text-2xl font-extrabold text-purple-900 font-mono">
                      ETB {categorySavings.MONTHLY_SAVING.toFixed(2)}
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Regular contributions
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-4 rounded-xl shadow-sm">
                    <div className="text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
                      Initial Savings
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-900 font-mono">
                      ETB {categorySavings.INITIAL_SAVING.toFixed(2)}
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">
                      Share capital
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-xl shadow-sm">
                    <div className="text-orange-700 text-xs font-bold uppercase tracking-wider mb-1">
                      Irregular Savings
                    </div>
                    <div className="text-2xl font-extrabold text-orange-900 font-mono">
                      ETB {categorySavings.IRREGULAR_SAVING.toFixed(2)}
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      Additional contributions
                    </p>
                  </div>

                  {interestRate > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 rounded-xl shadow-sm">
                      <div className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">
                        🎁 Accumulated Interest
                      </div>
                      <div className="text-2xl font-extrabold text-green-900 font-mono">
                        ETB {accumulatedInterest.toFixed(2)}
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {interestRate}%{" "}
                        {interestCalculationMethod
                          .replace(/_/g, " ")
                          .toLowerCase()}
                      </p>
                    </div>
                  )}

                  {interestRate > 0 && (
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-4 rounded-xl shadow-sm col-span-2 lg:col-span-1">
                      <div className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">
                        💎 Total (with Interest)
                      </div>
                      <div className="text-2xl font-extrabold text-rose-900 font-mono">
                        ETB {totalWithInterest.toFixed(2)}
                      </div>
                      <p className="text-xs text-rose-600 mt-1">
                        Principal + Interest earned
                      </p>
                    </div>
                  )}
                </div>

                {interestRate > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-blue-700 font-semibold text-xs">
                          Interest Rate
                        </div>
                        <div className="text-blue-900 font-bold text-lg">
                          {interestRate}% p.a.
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-700 font-semibold text-xs">
                          Method
                        </div>
                        <div className="text-blue-900 font-bold">
                          {interestCalculationMethod.replace(/_/g, " ")}
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-700 font-semibold text-xs">
                          Principal
                        </div>
                        <div className="text-blue-900 font-bold">
                          ETB {(userSavingsDetail.totalSavings || 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-700 font-semibold text-xs">
                          Interest Earned
                        </div>
                        <div className="text-green-600 font-bold">
                          +ETB {accumulatedInterest.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============== Savings Ledger Block ============== */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                          📜 Complete Saving Transaction History
                        </h3>
                        <p className="text-xs text-emerald-700 mt-1">
                          All transactions are immutable. Corrections made
                          through adjustment entries.
                        </p>
                      </div>
                      {activeRecords.length > 0 && (
                        <button
                          onClick={exportSavingsHistory}
                          className="bg-white border border-emerald-300 text-emerald-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors"
                        >
                          📥 Export CSV
                        </button>
                      )}
                    </div>
                  </div>

                  {activeRecords.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400 italic text-center">
                      No transactions recorded yet. Start with the initial
                      saving transaction.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                              <th className="px-6 py-3">Date</th>
                              <th className="px-6 py-3">Category</th>
                              <th className="px-6 py-3">Type</th>
                              <th className="px-6 py-3">Method</th>
                              <th className="px-6 py-3">Reference</th>
                              <th className="px-6 py-3 text-right">Amount</th>
                              <th className="px-6 py-3">Remarks</th>
                              <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {paginatedRecords.length === 0 ? (
                              <tr>
                                <td
                                  colSpan="8"
                                  className="px-6 py-6 text-center"
                                >
                                  <p className="text-slate-400 text-sm">
                                    No transactions match your filters
                                  </p>
                                </td>
                              </tr>
                            ) : (
                              paginatedRecords.map((record) => (
                                <tr
                                  key={record.id}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  <td className="px-6 py-3 text-slate-700 font-medium whitespace-nowrap">
                                    {moment(record.transactionDate).format(
                                      "MMM DD, YYYY",
                                    )}
                                  </td>
                                  <td className="px-6 py-3">
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold border ${getCategoryBadgeColor(
                                        record.category,
                                      )}`}
                                    >
                                      {record.category
                                        .replace(/_/g, " ")
                                        .substring(0, 12)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold border ${getTransactionTypeBadgeColor(
                                        record.type,
                                      )}`}
                                    >
                                      {record.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-slate-500 text-xs font-semibold">
                                    {record.paymentMethod}
                                  </td>
                                  <td className="px-6 py-3 text-slate-500 text-xs font-mono">
                                    {record.referenceNo || "—"}
                                  </td>
                                  <td className="px-6 py-3 text-right font-bold font-mono text-slate-900 whitespace-nowrap">
                                    <span
                                      className={`${
                                        record.type === "WITHDRAWAL"
                                          ? "text-red-600"
                                          : "text-emerald-600"
                                      }`}
                                    >
                                      {record.type === "WITHDRAWAL" ? "−" : "+"}
                                      {Math.abs(
                                        parseFloat(record.amount),
                                      ).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-xs text-slate-600 truncate max-w-xs">
                                    {record.remarks || "—"}
                                  </td>
                                  <td className="px-6 py-3 text-center">
                                    <button
                                      onClick={() => openDeleteModal(record)}
                                      className="text-amber-600 hover:text-amber-800 text-xs font-semibold px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 transition-colors"
                                      title="Create adjustment entry to correct this transaction"
                                    >
                                      Correct
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {filteredRecords.length > ITEMS_PER_PAGE && (
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                          <Pagination
                            currentPage={historyPage}
                            totalItems={filteredRecords.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setHistoryPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm">
                Could not load member financial details.
              </div>
            )}
          </div>

          {/* ============== Transaction Entry Form Sidebar ============== */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 rounded-2xl shadow-sm sticky top-6 max-h-screen overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase mb-6 pb-3 border-b border-slate-300">
              📝 Record Saving Transaction
            </h3>

            {selectedUserStatus !== "ACTIVE" && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-xs font-semibold">
                ⚠️ Only active members can make transactions.
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmitPayment)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Saving Category *
                </label>
                <select
                  {...register("category", { required: true })}
                  disabled={selectedUserStatus !== "ACTIVE"}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-emerald-500"
                >
                  {savingCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-500">Category is required</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Amount (ETB) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 font-semibold">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("amount", {
                      required: "Amount is required",
                      min: {
                        value: 0,
                        message: "Amount must be positive",
                      },
                    })}
                    disabled={selectedUserStatus !== "ACTIVE"}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pl-8 text-sm font-mono outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                {category === "MONTHLY_SAVING" && minimumSavingAmount > 0 && (
                  <p className="text-xs text-slate-500 font-semibold">
                    Minimum: ETB {minimumSavingAmount.toFixed(2)}
                  </p>
                )}
                {errors.amount && (
                  <p className="text-xs text-red-500">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Payment Method *
                </label>
                <select
                  {...register("paymentMethod", { required: true })}
                  disabled={selectedUserStatus !== "ACTIVE"}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-emerald-500"
                >
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {paymentMethod === "PAYROLL" && (
                <div className="space-y-1.5">
                  <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    Payroll Month *
                  </label>
                  <input
                    type="month"
                    {...register("payrollMonth", {
                      required:
                        paymentMethod === "PAYROLL"
                          ? "Payroll month is required"
                          : false,
                    })}
                    disabled={selectedUserStatus !== "ACTIVE"}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-emerald-500"
                  />
                  {errors.payrollMonth && (
                    <p className="text-xs text-red-500">
                      {errors.payrollMonth.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  {...register("transactionDate", { required: true })}
                  disabled={selectedUserStatus !== "ACTIVE"}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                  Reference & Notes (Optional)
                </label>
                <input
                  type="text"
                  {...register("referenceNo")}
                  disabled={selectedUserStatus !== "ACTIVE"}
                  placeholder="Ref # or slip number"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 mb-2 text-xs outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-emerald-500"
                />
                <textarea
                  {...register("remarks")}
                  disabled={selectedUserStatus !== "ACTIVE"}
                  placeholder="Additional notes or remarks..."
                  rows="2"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading || selectedUserStatus !== "ACTIVE"}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {submitLoading
                  ? "Processing..."
                  : "✓ Record Saving Transaction"}
              </button>

              <p className="text-[10px] text-slate-500 italic mt-4 pt-4 border-t border-slate-300">
                📋 All transactions are immutable and recorded in the audit log
                for accountability.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ============== Correction Modal ============== */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl space-y-4 animate-in zoom-in duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create Adjustment Entry
                </h3>
                <p className="text-xs text-slate-500">
                  Original transaction preserved in audit
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Original Transaction:</strong>
                <br />
                {deleteModal.record.category.replace(/_/g, " ")} - ETB{" "}
                {parseFloat(deleteModal.record.amount).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                Correction Reason *
              </label>
              <textarea
                placeholder="Explain why this transaction needs to be corrected..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={deleting}
                rows="3"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none disabled:opacity-50 resize-none focus:ring-1 focus:ring-amber-500"
              />
              {!deleteReason && (
                <p className="text-xs text-red-500 font-semibold">
                  Please provide a reason for the correction
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-slate-600 text-sm font-semibold border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                onClick={handleDeleteRecord}
                disabled={deleting || !deleteReason.trim()}
              >
                {deleting ? "Processing..." : "Create Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSavings;

const ReconQueue_data = [
  {
    id: 101,
    invoice_number: "INV-RECON-001",
    invoice_date: "2025-06-01",
    due_date: "2025-07-05",
    total_amount: "98500.00",
    gst_amount: "15000.00",
    base_amount: "83500.00",
    grn_amount: "83000.00",
    po_amount: "84000.00",
    amount_variance: 1.2,
    po_number: "PO-RECON-001",
    currency: "INR",
    vendor: {
      id: 201,
      vendor_code: "RECV001",
      name: "Recon Supplier A",
      gstin: "27RECON001XYZ",
      address: "Pune MIDC Area"
    },
    status: "queued for matching",
    priority: "medium",
    match_confidence: 68.5,
    comments: "Waiting for rules",
    created_at: "2025-06-10T10:01:00+05:30",
    updated_at: "2025-06-10T10:01:00+05:30"
  },
  {
    id: 102,
    invoice_number: "INV-RECON-002",
    invoice_date: "2025-06-02",
    due_date: "2025-07-06",
    total_amount: "87500.00",
    gst_amount: "13400.00",
    base_amount: "74100.00",
    grn_amount: "74500.00",
    po_amount: "75000.00",
    amount_variance: 0.9,
    po_number: "PO-RECON-002",
    currency: "INR",
    vendor: {
      id: 202,
      vendor_code: "RECV002",
      name: "Recon Supplier B",
      gstin: "29RECON002XYZ",
      address: "Bengaluru Electronic City"
    },
    status: "verified",
    priority: "high",
    match_confidence: 95.3,
    comments: "Successfully matched",
    created_at: "2025-06-10T10:10:00+05:30",
    updated_at: "2025-06-10T10:10:00+05:30"
  },
  {
    id: 103,
    invoice_number: "INV-RECON-003",
    invoice_date: "2025-06-03",
    due_date: "2025-07-07",
    total_amount: "90300.00",
    gst_amount: "13700.00",
    base_amount: "76600.00",
    grn_amount: "76000.00",
    po_amount: "77000.00",
    amount_variance: 1.1,
    po_number: "PO-RECON-003",
    currency: "INR",
    vendor: {
      id: 203,
      vendor_code: "RECV003",
      name: "Recon Supplier C",
      gstin: "07RECON003XYZ",
      address: "Connaught Place, Delhi"
    },
    status: "rejected",
    priority: "low",
    match_confidence: 42.1,
    comments: "Mismatch in PO details",
    created_at: "2025-06-10T10:20:00+05:30",
    updated_at: "2025-06-10T10:20:00+05:30"
  },
  // Generate 9 more using a rotating pattern for statuses and vendors
  ...Array.from({ length: 9 }, (_, idx) => {
    const id = 104 + idx;
    const statuses = ["queued for matching", "verified", "rejected"];
    const status = statuses[idx % 3];

    return {
      id,
      invoice_number: `INV-RECON-${id}`,
      invoice_date: `2025-06-${(id % 30 + 1).toString().padStart(2, "0")}`,
      due_date: `2025-07-${(id % 30 + 5).toString().padStart(2, "0")}`,
      total_amount: `${70000 + id * 125}.00`,
      gst_amount: `${10500 + id * 15}.00`,
      base_amount: `${60000 + id * 110}.00`,
      grn_amount: `${59500 + id * 105}.00`,
      po_amount: `${60500 + id * 100}.00`,
      amount_variance: (Math.random() * 2).toFixed(2),
      po_number: `PO-RECON-${id}`,
      currency: "INR",
      vendor: {
        id: id + 200,
        vendor_code: `RECV${id}`,
        name: `Vendor ${id}`,
        gstin: `27GSTIN${id}XYZ`,
        address: `Block ${id}, Recon City`
      },
      status,
      priority: ["low", "medium", "high"][id % 3],
      match_confidence:
        status === "rejected"
          ? Math.random() * 50
          : Math.random() * 30 + 70,
      comments:
        status === "verified"
          ? "Matched successfully"
          : status === "rejected"
          ? "Rule conflict or variance"
          : "Awaiting match engine",
      created_at: `2025-06-10T1${id % 10}:30:00+05:30`,
      updated_at: `2025-06-10T1${id % 10}:30:00+05:30`
    };
  })
];

export default ReconQueue_data;

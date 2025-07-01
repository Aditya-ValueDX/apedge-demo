const ExtractionQueue_data = [
  // Existing entry continued from ID 23...
  {
    id: 24,
    invoice_number: "INV-2024-120",
    invoice_date: "2025-06-07",
    due_date: "2025-07-12",
    total_amount: "87500.00",
    gst_amount: "13400.00",
    base_amount: "74100.00",
    grn_amount: "74500.00",
    po_amount: "75000.00",
    amount_variance: 1.25,
    po_number: "PO-2024-520",
    currency: "INR",
    vendor: {
      id: 9,
      vendor_code: "VEND009",
      name: "Delta Corp",
      gstin: "03DELTA4455J2H8",
      address: "Chandigarh Industrial Area"
    },
    status: "OCR in progress...",
    priority: "medium",
    exceptions: [],
    ocr_confidence: 0,
    comments: "",
    erp_document_number: "",
    erp_posted_at: null,
    processed_at: null,
    processed_by: null,
    original_document: null,
    line_items: [],
    created_at: "2025-06-10T09:01:00+05:30",
    updated_at: "2025-06-10T09:01:00+05:30"
  },
  {
    id: 25,
    invoice_number: "INV-2024-121",
    invoice_date: "2025-06-06",
    due_date: "2025-07-15",
    total_amount: "45200.00",
    gst_amount: "6900.00",
    base_amount: "38300.00",
    grn_amount: "38000.00",
    po_amount: "38500.00",
    amount_variance: 1.3,
    po_number: "PO-2024-521",
    currency: "INR",
    vendor: {
      id: 10,
      vendor_code: "VEND010",
      name: "Ace Solutions",
      gstin: "11ACESO9834B2K1",
      address: "Gachibowli, Hyderabad"
    },
    status: "Ready for review",
    priority: "low",
    exceptions: [],
    ocr_confidence: 92.7,
    comments: "No issues found",
    erp_document_number: "",
    erp_posted_at: null,
    processed_at: null,
    processed_by: null,
    original_document: null,
    line_items: [],
    created_at: "2025-06-10T09:10:30+05:30",
    updated_at: "2025-06-10T09:10:30+05:30"
  },
  {
    id: 26,
    invoice_number: "INV-2024-122",
    invoice_date: "2025-06-05",
    due_date: "2025-07-13",
    total_amount: "120000.00",
    gst_amount: "18300.00",
    base_amount: "101700.00",
    grn_amount: "101000.00",
    po_amount: "102000.00",
    amount_variance: 1.0,
    po_number: "PO-2024-522",
    currency: "INR",
    vendor: {
      id: 11,
      vendor_code: "VEND011",
      name: "Nova Tech",
      gstin: "06NOVAT8892T1Q7",
      address: "IT Park, Mohali, Punjab"
    },
    status: "OCR failed - poor quality",
    priority: "high",
    exceptions: [{ type: "Image Issue", description: "Blurry document upload" }],
    ocr_confidence: 45.3,
    comments: "Re-upload required",
    erp_document_number: "",
    erp_posted_at: null,
    processed_at: null,
    processed_by: null,
    original_document: null,
    line_items: [],
    created_at: "2025-06-10T09:20:10+05:30",
    updated_at: "2025-06-10T09:20:10+05:30"
  },
  {
    id: 27,
    invoice_number: "INV-2024-123",
    invoice_date: "2025-06-02",
    due_date: "2025-07-07",
    total_amount: "63500.00",
    gst_amount: "9675.00",
    base_amount: "53825.00",
    grn_amount: "53500.00",
    po_amount: "54000.00",
    amount_variance: 1.3,
    po_number: "PO-2024-523",
    currency: "INR",
    vendor: {
      id: 12,
      vendor_code: "VEND012",
      name: "InfraTech Ltd",
      gstin: "29INFTC9382M4D3",
      address: "Whitefield, Bengaluru"
    },
    status: "Waiting to process",
    priority: "medium",
    exceptions: [],
    ocr_confidence: 0,
    comments: "Uploaded but not yet processed",
    erp_document_number: "",
    erp_posted_at: null,
    processed_at: null,
    processed_by: null,
    original_document: null,
    line_items: [],
    created_at: "2025-06-10T09:30:00+05:30",
    updated_at: "2025-06-10T09:30:00+05:30"
  },
  // Create 8 more using these same formats and cycle through the 4 statuses
  ...Array.from({ length: 8 }, (_, idx) => {
    const id = 28 + idx;
    const statuses = [
      "OCR in progress...",
      "Ready for review",
      "OCR failed - poor quality",
      "Waiting to process"
    ];
    const status = statuses[idx % 4];
    return {
      id,
      invoice_number: `INV-2024-12${id - 23}`,
      invoice_date: `2025-06-${(id % 30 + 1).toString().padStart(2, "0")}`,
      due_date: `2025-07-${(id % 30 + 10).toString().padStart(2, "0")}`,
      total_amount: `${60000 + id * 100}.00`,
      gst_amount: `${9000 + id * 20}.00`,
      base_amount: `${50000 + id * 80}.00`,
      grn_amount: `${49000 + id * 70}.00`,
      po_amount: `${49500 + id * 60}.00`,
      amount_variance: (Math.random() * 2).toFixed(2),
      po_number: `PO-2024-52${id}`,
      currency: "INR",
      vendor: {
        id: id,
        vendor_code: `VEND0${id}`,
        name: `Vendor ${id}`,
        gstin: `27GSTIN${id}XYZ`,
        address: `Area ${id}, City`
      },
      status,
      priority: ["low", "medium", "high"][id % 3],
      exceptions: status.includes("failed")
        ? [{ type: "Scan Error", description: "Unclear image" }]
        : [],
      ocr_confidence: status.includes("failed")
        ? Math.random() * 50
        : Math.random() * 30 + 70,
      comments: "",
      erp_document_number: "",
      erp_posted_at: null,
      processed_at: null,
      processed_by: null,
      original_document: null,
      line_items: [],
      created_at: `2025-06-10T0${id % 10}:45:00+05:30`,
      updated_at: `2025-06-10T0${id % 10}:45:00+05:30`
    };
  })
];

export default ExtractionQueue_data;

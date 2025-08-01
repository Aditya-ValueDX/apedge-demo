import React, { useState, useEffect } from "react";

import { ChevronDown, ChevronUp, Trash2, Pencil, GripVertical, Mail, CheckCircle, Send, Plus, Save, Settings, RotateCcw,} from "lucide-react";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { BASE_URL } from '../../config'; // Import BASE_URL

const fieldTypes = ["text", "number", "date", "array", "boolean"];
const reconcileOptions = ["None", "PO", "GRN", "PO,GRN"];

// New components for the tabs
const AutoApproveConfig = () => {
  const [config, setConfig] = useState({
    extractionAndApprove: true,
    reconciliationAndSend: false,
  });

  const handleToggle = (step) => {
    setConfig((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const handleSave = () => {
    console.log("Saving Auto-Approve Config:", config);
    // Using a custom modal or toast instead of alert
    // alert("Auto-Approve configuration saved!");
    // For now, let's just log. In a real app, you'd show a success message.
    console.log("Auto-Approve configuration saved!");
  };

  return (
    <div className="config-section">
      <h3 className="config-title">Auto-Approval Process Steps</h3>
      <p className="config-description">
        Enable or disable steps in the automated invoice approval workflow.
      </p>
      <div className="stepper">
        <div className="step">
          <div className="step-icon-wrapper">
            <CheckCircle className="step-icon" size={24} />
          </div>
          <div className="step-content">
            <h4 className="step-title">Extraction & Approve</h4>
            <p className="step-description">
              Automatically approve data extracted from invoices.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={config.extractionAndApprove}
              onChange={() => handleToggle("extractionAndApprove")}
            />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-icon-wrapper">
            <Send className="step-icon" size={24} />
          </div>
          <div className="step-content">
            <h4 className="step-title">Reconciliation & Send to ERP</h4>
            <p className="step-description">
              Reconcile and send the approved data to your ERP system.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={config.reconciliationAndSend}
              onChange={() => handleToggle("reconciliationAndSend")}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      <div className="footer-actions">
        <button className="action-button primary-action" onClick={handleSave}>
          <Save size={16} /> Save Configuration
        </button>
      </div>
    </div>
  );
};

const EmailConfig = () => {
  const [emails, setEmails] = useState({ to: "", cc: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving Email Config:", emails);
    // Using a custom modal or toast instead of alert
    // alert("Email settings saved!");
    console.log("Email settings saved!");
  };

  return (
    <div className="config-section">
      <h3 className="config-title">Notification Email Settings</h3>
      <p className="config-description">
        Set the recipients for email alerts when processing errors occur.
      </p>
      <div className="email-form">
        <div className="form-group">
          <label htmlFor="to-emails">To:</label>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="text"
              id="to-emails"
              name="to"
              value={emails.to}
              onChange={handleChange}
              placeholder="admin@example.com, support@example.com"
            />
          </div>
          <small>
            Use comma-separated values for multiple email addresses.
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="cc-emails">CC:</label>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              type="text"
              id="cc-emails"
              name="cc"
              value={emails.cc}
              onChange={handleChange}
              placeholder="manager@example.com"
            />
          </div>
          <small>
            Use comma-separated values for multiple email addresses.
          </small>
        </div>
      </div>
      <div className="footer-actions">
        <button className="action-button primary-action" onClick={handleSave}>
          <Save size={16} /> Save Email Settings
        </button>
      </div>
    </div>
  );
};

const InvoiceStrucDef = ({ triggerRefreshUP, triggerSidebarRefresh }) => {
  const [fields, setFields] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const [activeTab, setActiveTab] = useState("extraction");
  const admin = JSON.parse(sessionStorage.getItem("user"));
  const adminId = admin.id;

  const [tableConfigGenerated, setTableConfigGenerated] = useState(false);
  const isGenerated = async (adminId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/check-config/${adminId}`
      );
      const adminExists = res.data.exists;
      return adminExists;
    } catch (err) {
      console.error("❌ Admin check failed:", err);
      return { exists: false };
    }
  };
  useEffect(() => {
    const admin = JSON.parse(sessionStorage.getItem("user"));
    if (!admin?.id) return;

    isGenerated(admin.id).then((exists) => {
      setTableConfigGenerated(exists);
    });
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/generic-fields`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const mapped = data.map((f) => ({
          section: f.section,
          name: f.Feild,
          type: f.type,
          parent: "",
          desc: f.desc,
          // Removed 'required'
          reconcile: "None", // Default to 'None' for new fields
          use_LLM: false, // Added 'use_LLM' field
        }));
        setFields(mapped);
        setCanSave(true);
        setCanGenerate(false);
      })
      .catch((err) => console.error("❌ Failed to load generic fields:", err));
  }, []);

  const [tableConfig, setTableConfig] = useState(null);

  useEffect(() => {
    const admin = JSON.parse(sessionStorage.getItem("user"));
    if (!admin) return;

    axios
      .get(`${BASE_URL}/api/get-table-config/${admin.id}`)
      .then((res) => {
        if (res.data?.config) {
          const configObj = res.data.config;
          const converted = Object.entries(configObj).map(([name, meta]) => ({
            name,
            ...meta,
            // Ensure reconcile and use_LLM are present, default to false if not in config
            reconcile: meta.reconcile || "None", // Default to 'None'
            use_LLM: meta.use_LLM || false, // Default to false
          }));
          setFields(converted);
          setTableConfig(configObj);
          setCanSave(false);
          setCanGenerate(true);
        } else {
          throw new Error("No config found");
        }
      })
      .catch((err) => {
        console.warn("⚠️ No config found, falling back to generic fields");
        // Fallback logic is already in another useEffect
      });
  }, [tableConfigGenerated]);

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: "",
        type: "text",
        parent: "",
        desc: "",
        reconcile: "None", // Default for new field
        use_LLM: false, // Default for new field
      },
    ]);
    setCanSave(true);
    setCanGenerate(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(active.id);
    const newIndex = parseInt(over.id);
    setFields((items) => arrayMove(items, oldIndex, newIndex));
    setCanSave(true);
  };
  const sensors = useSensors(useSensor(PointerSensor));
  function SortableRow({ id, index, field, idx, children }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 100 : "auto",
      boxShadow: isDragging ? "0 10px 20px rgba(0,0,0,0.15)" : undefined,
      backgroundColor: isDragging ? "rgba(255, 255, 255, 0.95)" : "inherit",
    };

    return (
      <tr ref={setNodeRef} style={style} {...attributes}>
        {children(listeners, field, idx)}
      </tr>
    );
  }

  const handleRemoveField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
    setCanSave(true);
    setCanGenerate(false);
  };

  const handleFieldChange = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
    setCanSave(true);
    setCanGenerate(false);
  };

  const handleSaveSchema = () => {
    setShowDialog(true);
  };

  const cancelGenerate = () => setShowDialog(false);

  const confirmGenerate = () => {
    const admin = JSON.parse(sessionStorage.getItem("user"));
    const config = fields.reduce((acc, field) => {
      acc[field.name] = {
        type: field.type,
        // removed 'required'
        parent: field.parent,
        desc: field.desc,
        reconcile: field.reconcile, // Include reconcile
        use_LLM: field.use_LLM,     // Include use_LLM
      };
      return acc;
    }, {});
    setTableConfig(config);
    setTableConfigGenerated(true);
    triggerSidebarRefresh();
    axios
      .post(`${BASE_URL}/api/save-or-update-table-config`, {
        adminId: admin.id,
        config,
      })
      .then((res) => {
        console.log("✅ Config saved:", res.data);
      })
      .catch((err) => {
        console.error("❌ Failed to save config:", err);
        // Using a custom modal or toast instead of alert
        // alert(err.response?.data?.error || "Save failed");
        console.log(err.response?.data?.error || "Save failed");
      });
    triggerSidebarRefresh();
    triggerRefreshUP();
    setShowDialog(false);
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleEditTable = () => {
    setTableConfigGenerated(false);
  };

  return (
    <div className="invoice-struct-def">
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "extraction" ? "active" : ""}`}
          onClick={() => setActiveTab("extraction")}
        >
          <Settings size={16} /> Extraction Config
        </button>
        <button
          className={`tab-button ${
            activeTab === "autoApprove" ? "active" : ""
          }`}
          onClick={() => setActiveTab("autoApprove")}
        >
          <CheckCircle size={16} /> Auto Approve Config
        </button>
        <button
          className={`tab-button ${activeTab === "email" ? "active" : ""}`}
          onClick={() => setActiveTab("email")}
        >
          <Mail size={16} /> Email Config
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "extraction" && (
          <>
            <h2 className="section-heading">
              Extraction Table Field Configuration
            </h2>
            {!tableConfigGenerated ? (
              <div className="field-table-wrapper">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="field-table">
                    <thead>
                      <tr>
                        <th style={{ width: "5%" }}>Sr.</th>
                        <th style={{ width: "20%" }}>Field Name</th>
                        <th style={{ width: "10%" }}>Type</th>
                        <th style={{ width: "15%" }}>Parent</th>
                        <th style={{ width: "25%" }}>Description</th>
                        <th style={{ width: "10%" }}>Reconcile</th> {/* Changed column header */}
                        <th style={{ width: "5%" }}>Use LLM</th>      {/* Added Use LLM column */}
                        <th style={{ width: "5%" }}>Del</th>
                        <th style={{ width: "5%" }}>Drag</th>
                      </tr>
                    </thead>
                    <SortableContext
                      items={fields.map((_, idx) => idx.toString())}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody>
                        {fields.map((field, idx) => (
                          <SortableRow key={idx} id={idx.toString()} index={idx} field={field} idx={idx}>
                            {(listeners, rowField, rowIdx) => (
                              <>
                                <td style={{ textAlign: "center", color: "#6c757d" }}>{rowIdx + 1}</td>
                                <td><input type="text" className="editable-input" defaultValue={rowField.name} onBlur={(e) => handleFieldChange(rowIdx, "name", e.target.value)} /></td>
                                <td><select className="editable-input" defaultValue={rowField.type} onBlur={(e) => handleFieldChange(rowIdx, "type", e.target.value)}>{fieldTypes.map((type) => (<option key={type}>{type}</option>))}</select></td>
                                <td><select className="editable-input" defaultValue={rowField.parent} onBlur={(e) => handleFieldChange(rowIdx, "parent", e.target.value)}><option value=""></option>{fields.filter((f, i) => i !== rowIdx && f.type === "array" && f.name).map((f) => (<option key={f.name} value={f.name}>{f.name}</option>))}</select></td>
                                <td><input type="text" className="editable-input" defaultValue={rowField.desc} onBlur={(e) => handleFieldChange(rowIdx, "desc", e.target.value)} /></td>
                                <td style={{ textAlign: "center" }}> {/* Reconcile dropdown */}
                                  <select
                                    className="editable-input"
                                    value={rowField.reconcile}
                                    onChange={(e) => handleFieldChange(rowIdx, "reconcile", e.target.value)}
                                  >
                                    {reconcileOptions.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </td>
                                <td style={{ textAlign: "center" }}><input type="checkbox" checked={rowField.use_LLM} onChange={(e) => handleFieldChange(rowIdx, "use_LLM", e.target.checked)} /></td> {/* use_LLM checkbox */}
                                <td style={{ textAlign: "center" }}>
                                  <button
                                    className="delete-btn"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleRemoveField(rowIdx)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                                <td className="drag-handle" {...listeners}><GripVertical size={16} /></td>
                              </>
                            )}
                          </SortableRow>
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
            ) : (
              <div className="field-table-wrapper">
                <table className="field-table">
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>Sr.</th>
                      <th style={{ width: "25%" }}>Field Name</th>
                      <th style={{ width: "15%" }}>Type</th>
                      <th style={{ width: "15%" }}>Parent</th>
                      <th style={{ width: "30%" }}>Description</th>
                      <th style={{ width: "5%" }}>Rec.</th> {/* Abbreviated for space */}
                      <th style={{ width: "5%" }}>LLM</th> {/* Abbreviated for space */}
                    </tr>
                  </thead>
                  <tbody>
                    {tableConfig &&
                      Object.entries(tableConfig).map(
                        ([fieldName, fieldData], idx) => (
                          <tr key={idx}>
                            <td
                              style={{ textAlign: "center", color: "#6c757d" }}
                            >
                              {idx + 1}
                            </td>
                            <td>
                              <input
                                type="text"
                                value={fieldName}
                                disabled
                                className="readonly-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={fieldData.type}
                                disabled
                                className="readonly-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={fieldData.parent || "—"}
                                disabled
                                className="readonly-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={fieldData.desc || "—"}
                                disabled
                                className="readonly-input"
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="text" // Displaying text for reconcile option
                                value={fieldData.reconcile || "None"}
                                disabled
                                className="readonly-input"
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={fieldData.use_LLM}
                                disabled
                              />
                            </td>
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
              </div>
            )}
            {!tableConfigGenerated ? (
              <div className="footer-actions">
                <button
                  className="action-button primary-action"
                  onClick={handleAddField}
                >
                  <Plus size={16} /> Add Field
                </button>
                <button
                  className="action-button primary-action"
                  onClick={handleSaveSchema}
                  disabled={!canSave}
                >
                  <Save size={16} /> Save Structure
                </button>
                {/* <button
                  className="action-button danger-action"
                  onClick={handleReset}
                >
                  <RotateCcw size={16} /> Reset
                </button> */}
              </div>
            ) : (
              <div className="footer-actions">
                <button
                  className="action-button secondary-action"
                  onClick={handleEditTable}
                >
                  <Pencil size={16} /> Edit table
                </button>
              </div>
            )}
          </>
        )}
        {activeTab === "autoApprove" && <AutoApproveConfig />}
        {activeTab === "email" && <EmailConfig />}
      </div>

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <p>
              This is a one-time process. Are you sure this is the final
              structure?
            </p>
            <div className="dialog-actions">
              <button
                className="action-button secondary-action"
                onClick={cancelGenerate}
              >
                No, Cancel
              </button>
              <button
                className="action-button primary-action"
                onClick={confirmGenerate}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        :root {
          --font-family: 'Poppins', sans-serif;
          --primary-color: #007bff;
          --primary-hover: #0056b3;
          --success-color: #28a745;
          --danger-color: #dc3545;
          --danger-hover: #c82333;
          --text-color: #343a40;
          --light-text: #6c757d;
          --border-color: #dee2e6;
          --light-bg: #f8f9fa;
          --white: #ffffff;
          --border-radius: 8px;
        }

        .invoice-struct-def {
          font-family: var(--font-family) !important;
          color: var(--text-color);
          padding: 20px;
          background: var(--light-bg);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          max-width: 1500px;
          margin: 20px 0px 20px 50px;
        }

        .tabs-container {
          display: flex;
          background-color: #e9ecef;
          border-radius: var(--border-radius);
          padding: 5px;
          margin-bottom: 24px;
        }

        .tab-button {
          flex: 1;
          padding: 10px 15px;
          font-size: 15px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--light-text);
          border-radius: 6px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .tab-button:hover {
          background: rgba(0,0,0,0.05);
        }

        .tab-button.active {
          background: var(--white);
          color: var(--primary-color);
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .tab-content {
          background: var(--white);
          padding: 20px 20px;
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
          max-height: 440px;               /* ✅ Fixed height */
          overflow-y: auto;            /* ✅ Enables vertical scroll when needed */
          overflow-x: hidden;
        }


        .config-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-color);
        }
        .config-description {
          font-size: 14px;
          color: var(--light-text);
          margin-bottom: 15px;
          max-width: 700px;
        }
        
        .stepper {
          position: relative;
          max-width: 600px;
          margin: 0 auto;
        }
        .step {
          display: flex;
          align-items: center;
          width: 100%;
          background: var(--white);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          position: relative;
          z-index: 1;
        }
        .step-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #e7f3ff;
          color: var(--primary-color);
          margin-right: 20px;
          flex-shrink: 0;
        }
        .step-content { flex-grow: 1; }
        .step-title { font-size: 16px; font-weight: 600; margin: 0 0 4px 0;}
        .step-description { font-size: 13px; color: var(--light-text); margin: 0; }
        .step-connector {
          position: absolute;
          left: 44px;
          top: 68px; /* start below the icon */
          width: 2px;
          height: 50px;
          background: linear-gradient(to bottom, #a2cffe, #e7f3ff);
          z-index: 0;
        }

        .switch { position: relative; display: inline-block; width: 50px; height: 28px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: var(--success-color); }
        input:checked + .slider:before { transform: translateX(22px); }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }

        .email-form { display: flex; flex-direction: column; gap: 24px; max-width: 700px; }
        .form-group label { font-weight: 500; margin-bottom: 8px; font-size: 14px; }
        .input-with-icon { display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: var(--border-radius); transition: all 0.2s ease; }
        .input-with-icon:focus-within { border-color: var(--primary-color); box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); }
        .input-with-icon svg { color: var(--light-text); margin: 0 12px; }
        .form-group input { flex-grow: 1; padding: 12px 0; border: none; outline: none; font-size: 14px; background: transparent; font-family: var(--font-family); }
        .form-group small { font-size: 12px; color: var(--light-text); margin-top: 6px; }

        .section-heading { font-size: 20px; font-weight: 600; margin-bottom: 24px; }
        
        .field-table-wrapper {
          height: 250px;
          overflow: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
        }
        
        .field-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .field-table thead { position: sticky; top: 0; z-index: 10; }
        .field-table th {
          background: var(--light-bg);
          font-weight: 600;
          color: var(--text-color);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
          padding: 12px 10px;
          text-align: left;
          border-bottom: 2px solid var(--border-color);
        }
        .field-table tbody tr { transition: background-color 0.2s ease; }
        .field-table tbody tr:hover { background-color: #f1f8ff; }
        .field-table td { border-bottom: 1px solid var(--border-color); padding: 4px; font-size: 14px; vertical-align: middle; }
        
        .editable-input, .field-table select {
          width: 100%;
          font-size: 14px !important;
          padding: 8px !important;
          box-sizing: border-box !important;
          background-color: transparent;
          border: 1px solid transparent !important;
          border-radius: 4px;
          outline: none !important;
          transition: all 0.2s ease;
        }
        .editable-input:focus, .field-table select:focus {
          background: var(--white);
          border: 1px solid var(--primary-color) !important;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .primary-action { background: var(--primary-color); color: var(--white); }
        .primary-action:hover { background: var(--primary-hover); }
        .primary-action:disabled { background: #adb5bd; cursor: not-allowed; }

        .secondary-action { background: #6c757d; color: var(--white); }
        .secondary-action:hover { background: #5a6268; }
        
        .danger-action { background: var(--danger-color); color: var(--white); }
        .danger-action:hover { background: var(--danger-hover); }

        .delete-btn {
          background: transparent;
          color: var(--light-text);
          border: none;
          padding: 6px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .delete-btn:hover { background: #ffebee; color: var(--danger-color); }
        
        .drag-handle {
          cursor: grab;
          text-align: center;
          color: var(--light-text);
          padding: 8px;
        }
        .drag-handle:active { cursor: grabbing; }

        .footer-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; padding-top: 10px; border-top: 1px solid var(--border-color); }
        
        .dialog-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .dialog-box { background: var(--white); padding: 32px; border-radius: 12px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-width: 400px; }
        .dialog-box p { margin: 0 0 24px 0; font-size: 16px; }
        .dialog-actions button { margin: 0 8px; }
        
        .readonly-input {
          width: 100%;
          border: none;
          background: transparent;
          padding: 8px;
          font-size: 14px;
          color: var(--text-color);
          font-family: var(--font-family);
        }
      `}</style>
    </div>
  );
};

export default InvoiceStrucDef;

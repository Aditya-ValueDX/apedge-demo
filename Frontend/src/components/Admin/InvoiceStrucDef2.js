import React, { useState, useEffect } from "react";

import {
  ChevronDown, ChevronUp,
  Trash2, Pencil, GripVertical
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import axios from "axios";

const fieldTypes = ["text", "number", "date", "array", "boolean"];

const InvoiceStrucDef = ({ triggerRefreshUP, triggerSidebarRefresh }) => {
  const [fields, setFields] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const admin = JSON.parse(sessionStorage.getItem("user"));
  const adminId = admin.id;


  const [tableConfigGenerated, setTableConfigGenerated] = useState(false);
  const isGenerated = async (adminId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/check-config/${adminId}`
      );
      const adminExists = res.data.exists; // ✅ true or false
      console.log(adminExists);

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
    fetch("http://localhost:5000/api/generic-fields")
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
          required: f.required,
        }));
        setFields(mapped);
        setCanSave(true);
        setCanGenerate(false);
      })
      .catch((err) => console.error("❌ Failed to load generic fields:", err));
  }, []);

  const [tableConfig, setTableConfig] = useState(null);

  // useEffect(() => {
  //   const admin = JSON.parse(sessionStorage.getItem("user"));
  //   if (!admin) return;

  //   axios
  //     .get(`http://localhost:5000/api/get-table-config/${admin.id}`)
  //     .then((res) => {
  //       setTableConfig(res.data.config);
  //       debugger
  //     })
  //     .catch((err) => {
  //       console.error("❌ Failed to load saved config:", err);
  //     });
  // }, []);

  useEffect(() => {
    const admin = JSON.parse(sessionStorage.getItem("user"));
    if (!admin) return;

    axios
      .get(`http://localhost:5000/api/get-table-config/${admin.id}`)
      .then((res) => {
        if (res.data?.config) {
          console.log("✅ Loaded existing table config");
          const configObj = res.data.config;
          const converted = Object.entries(configObj).map(([name, meta]) => ({
            name,
            ...meta,  // includes type, required, parent, desc
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

        fetch("http://localhost:5000/api/generic-fields")
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
              required: f.required,
            }));
            setFields(mapped);
            setCanSave(true);
            setCanGenerate(false);
          })
          .catch((err) =>
            console.error("❌ Failed to load generic fields:", err)
          );
      });
  }, [tableConfigGenerated]);


  const handleAddField = () => {
    setFields([
      ...fields,
      { name: "", type: "text", parent: "", desc: "", required: false },
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
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: isDragging ? "grabbing" : "grab",
      backgroundColor: isDragging ? "#f0f8ff" : "inherit",
      boxShadow: isDragging ? "0 2px 6px rgba(0,0,0,0.15)" : undefined
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

  // const handleGenerateTable = () => setShowDialog(true);
  const cancelGenerate = () => setShowDialog(false);

  const confirmGenerate = () => {
    const admin = JSON.parse(sessionStorage.getItem("user"));


    // if you feel like the no. of feilds mismatch, the Possible reason is that multiple feilds have same name, the reduce() is removing it
    // const nameCounts = {};
    // fields.forEach(f => {
    //   nameCounts[f.name] = (nameCounts[f.name] || 0) + 1;
    // });
    // console.log("Duplicate field names:", Object.entries(nameCounts).filter(([k, v]) => v > 1));

    const config = fields.reduce((acc, field) => {
      acc[field.name] = {
        type: field.type,
        required: field.required,
        parent: field.parent,
        desc: field.desc,
      };
      return acc;
    }, {});
    setTableConfig(config);
    debugger;
    setTableConfigGenerated(true);
    triggerSidebarRefresh();
    axios
      .post("http://localhost:5000/api/save-or-update-table-config", {
        adminId: admin.id,
        config,
      })
      .then((res) => {
        console.log("✅ Config saved:", res.data)
        debugger

      })
      .catch((err) => {
        console.error("❌ Failed to save config:", err);
        alert(err.response?.data?.error || "Save failed");
      });
    debugger;
    triggerSidebarRefresh();

    triggerRefreshUP();
    setShowDialog(false);
  };

  const handleReset = () => {
    // localStorage.removeItem("invoice_table_config");
    window.location.reload();
  };

  const handleEditTable = () => {
    // localStorage.removeItem("invoice_table_config");
    setTableConfigGenerated(false);
    //  triggerRefreshUP();
  };

  return (
    <div className="invoice-struct-def">
      <h2 className="section-heading">Extraction Table Field Configuration</h2>

      {!tableConfigGenerated && (
        <div style={{
          height: "360px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "4px",
          position: "relative"
        }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((_, idx) => idx.toString())} strategy={verticalListSortingStrategy}>
              <table className="field-table" style={{
                width: "100%",
                borderCollapse: "collapse"
              }}>
                <thead>
                  <tr style={{ background: "#f3f7fa" }}>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Sr.</th>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Field Name</th>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Type</th>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Parent</th>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Description</th>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Req</th>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Del</th>
                    <th style={{
                      padding: "10px",
                      borderBottom: "2px solid #ddd",
                      position: "sticky",
                      top: "0",
                      zIndex: 10,
                      background: "#f3f7fa"
                    }}>Drag</th>
                  </tr>
                </thead>
                <tbody style={{ background: "#fff" }}>
                  {fields.map((field, idx) => (
                    <SortableRow key={idx} id={idx.toString()} index={idx} field={field} idx={idx}>
                      {(listeners, rowField, rowIdx) => (
                        <>
                          <td style={{ padding: "8px" }}>{rowIdx + 1}</td>
                          <td style={{ padding: "4px" }}>
                            <input
                              type="text"
                              className="editable-input"
                              value={rowField.name}
                              onChange={(e) => handleFieldChange(rowIdx, "name", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "4px" }}>
                            <select
                              className="editable-input"
                              value={rowField.type}
                              onChange={(e) => handleFieldChange(rowIdx, "type", e.target.value)}
                            >
                              {fieldTypes.map((type) => (
                                <option key={type}>{type}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: "4px" }}>
                            <select
                              className="editable-input"
                              value={rowField.parent}
                              onChange={(e) => handleFieldChange(rowIdx, "parent", e.target.value)}
                            >
                              <option value=""></option>
                              {fields
                                .filter((f, i) => i !== rowIdx && f.type === "array" && f.name)
                                .map((f) => (
                                  <option key={f.name} value={f.name}>
                                    {f.name}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td style={{ padding: "4px" }}>
                            <input
                              type="text"
                              className="editable-input"
                              value={rowField.desc}
                              onChange={(e) => handleFieldChange(rowIdx, "desc", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={rowField.required}
                              onChange={(e) => handleFieldChange(rowIdx, "required", e.target.checked)}
                            />
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <button className="delete-btn" style={{ color: "white" }} onClick={() => handleRemoveField(rowIdx)}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                          <td style={{ cursor: "grab", padding: "8px", textAlign: "center" }} {...listeners}>
                            <GripVertical size={13} />
                          </td>
                        </>
                      )}
                    </SortableRow>
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {tableConfigGenerated && tableConfig && typeof tableConfig === 'object' && (
        <div className="field-table-wrapper" style={{
          height: "360px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "4px"
        }}>
          <table className="field-table" style={{
            width: "100%",
            borderCollapse: "collapse"
          }}>
            <thead style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#f8f9fa",
              zIndex: 2,
              borderBottom: "2px solid #dee2e6"
            }}>
              <tr>
                <th style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: "600",
                  borderRight: "1px solid #dee2e6"
                }}>Sr.</th>
                <th style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: "600",
                  borderRight: "1px solid #dee2e6"
                }}>Field Name</th>
                <th style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: "600",
                  borderRight: "1px solid #dee2e6"
                }}>Type</th>
                <th style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: "600",
                  borderRight: "1px solid #dee2e6"
                }}>Parent</th>
                <th style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: "600",
                  borderRight: "1px solid #dee2e6"
                }}>Description</th>
                <th style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  fontWeight: "600"
                }}>Req</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tableConfig).map(([fieldName, fieldData], idx) => (
                <tr key={idx} style={{
                  borderBottom: "1px solid #dee2e6",
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#f8f9fa"
                }}>
                  <td style={{
                    padding: "8px",
                    borderRight: "1px solid #dee2e6"
                  }}>{idx + 1}</td>
                  <td style={{
                    padding: "4px",
                    borderRight: "1px solid #dee2e6"
                  }}>
                    <input
                      type="text"
                      value={fieldName}
                      disabled
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "4px"
                      }}
                    />
                  </td>
                  <td style={{
                    padding: "4px",
                    borderRight: "1px solid #dee2e6"
                  }}>
                    <input
                      type="text"
                      value={fieldData.type}
                      disabled
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "4px"
                      }}
                    />
                  </td>
                  <td style={{
                    padding: "4px",
                    borderRight: "1px solid #dee2e6"
                  }}>
                    <input
                      type="text"
                      value={fieldData.parent || ""}
                      disabled
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "4px"
                      }}
                    />
                  </td>
                  <td style={{
                    padding: "4px",
                    borderRight: "1px solid #dee2e6"
                  }}>
                    <input
                      type="text"
                      value={fieldData.desc || ""}
                      disabled
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        padding: "4px"
                      }}
                    />
                  </td>
                  <td style={{
                    textAlign: "center",
                    padding: "8px"
                  }}>
                    <input
                      type="checkbox"
                      checked={fieldData.required}
                      disabled
                      style={{
                        width: "14px",
                        height: "14px",
                        accentColor: "#007bff"
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      )}


      {!tableConfigGenerated && (
        <div className="footer-actions">
          <button className="add-btn" onClick={handleAddField}>
            + Add Field
          </button>
          <button
            className="save-btn"
            onClick={handleSaveSchema}
            disabled={!canSave}
          >
            Save Structure
          </button>
          {/* <button
            className="generate-btn"
            onClick={handleGenerateTable}
            disabled={!canGenerate}
          >
            Generate Table
          </button> */}
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      )}

      {tableConfigGenerated && (
        <div className="footer-actions">
          <button className="add-btn" onClick={handleEditTable}>
            Edit table &nbsp;&nbsp;
            <Pencil size={15} />
          </button>

        </div>
      )}

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <p>
              This is a one-time process. Are you sure this is the final
              structure?
            </p>
            <div className="dialog-actions">
              <button onClick={confirmGenerate}>Yes</button>
              <button onClick={cancelGenerate}>No</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
  .invoice-struct-def {
    padding: 24px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.08);
    max-width: 1000px;
    margin: 20px auto;
  }

  .section-heading {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 24px;
  }
        .save-btn:disabled,
.generate-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}

  .field-table-wrapper {
    overflow-x: auto;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    border-radius: 8px;
  }
    td:has([data-rbd-drag-handle-draggable-id]) {
  cursor: grab;
}


  .field-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 8px;
    overflow: hidden;
  }

  .field-table th, .field-table td {
    border: 1px solid #e0e0e0;
    padding: 6px 10px;
    font-size: 14px;
    vertical-align: middle;
  }

  .field-table th {
    background: linear-gradient(to right, #eef2f5, #f9fbfd);
    font-weight: 600;
    color: #2c3e50;
    text-transform: uppercase;
    font-size: 12px;
  }

  .field-table tbody tr:hover {
    background-color: #f7faff;
  }

  .field-table input[type="text"],
  .field-table select {
    width: 100%;
    height: 100% !important;
    font-size: 13px !important;
    padding: 2px 4px !important;
    box-sizing: border-box !important;
    background-color: transparent;
    border: none !important;
    outline: none !important;
    transition: all 0.2s ease;
  }

  .field-table input:focus,
  .field-table select:focus {
    background: #f9f9f9;
    // border: 1px solid #007bff !important;
    border-radius: 4px;
  }

  .field-table input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: #007bff;
  }

  .add-btn, .save-btn, .generate-btn, .reset-btn {
    background: #2c3e50;
    color: white;
    padding: 10px 14px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .add-btn:hover, .save-btn:hover, .generate-btn:hover, .reset-btn:hover {
    background: #1a252f;
  }

  .generate-btn {
    background: #27ae60;
  }

  .reset-btn {
    background: rgb(209, 59, 17);
  }

  .delete-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .delete-btn:hover {
    background: #c0392b;
  }

  .footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }
tr:hover {
  cursor: grab;
}
tr:active {
  cursor: grabbing !important;
}

td:has([data-rbd-drag-handle-draggable-id]) {
  cursor: grab !important;
}

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dialog-box {
    background: white;
    padding: 24px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }

  .dialog-actions button {
    margin: 0 10px;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

  .field-table th:nth-child(1),
  .field-table td:nth-child(1) {
    width: 40px !important;
    text-align: center !important;
  }

  .field-table th:nth-child(2),
  .field-table td:nth-child(2) {
    width: 160px !important;
  }

  .field-table th:nth-child(3),
  .field-table td:nth-child(3) {
    width: 100px !important;
  }

  .field-table th:nth-child(4),
  .field-table td:nth-child(4) {
    width: 140px !important;
  }

  .field-table th:nth-child(5),
  .field-table td:nth-child(5) {
    width: 240px !important;
  }

  .field-table th:nth-child(6),
  .field-table td:nth-child(6) {
    width: 40px !important;
    text-align: center !important;
  }

  .field-table th:nth-child(7),
  .field-table td:nth-child(7) {
    width: 40px !important;
    text-align: center !important;
  }
    .field-table th:nth-child(8),
  .field-table td:nth-child(8) {
    width: 40px !important;
    text-align: center !important;
  }
`}</style>
    </div>
  );
};

export default InvoiceStrucDef;

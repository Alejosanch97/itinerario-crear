import { useState, useEffect } from "react";
import "../Styles/home.css";

/* ==========================================================================
   CONFIGURACIÓN BASE Y ESTRUCTURAS POR DEFECTO
   ========================================================================== */

const STORAGE_KEY = "worldcup_travel_journal_v1";

const TASAS_CONVERSION_DEFAULT = {
  USD: 4000, // Dólar estadounidense
  EUR: 4300, // Euro
  GBP: 5100, // Libra esterlina
  JPY: 27,   // Yen japonés (por unidad aproximada)
  CAD: 2900, // Dólar canadiense
  AUD: 2600, // Dólar australiano
  CHF: 4500, // Franco suizo
  MXN: 240,  // Peso mexicano (regional de referencia)
  BRL: 800,  // Real brasileño (regional de referencia)
};

const nuevaActividad = () => ({
  nombre: "",
  descripcion: "",
  costoLocal: 0,
  imagenActividad: "",
});

const nuevoPais = () => ({
  dias: "",
  pais: "",
  bandera: "🏳️",
  ciudad: "",
  idioma: "",
  moneda: "USD",
  imagenPais: "",
  actividades: [nuevaActividad()],
  comidaTipica: { nombre: "", descripcion: "", costoLocal: 0 },
  hotel: { nombre: "", descripcion: "", costoLocal: 0 },
  camisetaFavorita: { nombre: "", descripcion: "" },
});

const ESTADO_INICIAL = {
  viajero: {
    nombreEstudiante: "",
    tituloViaje: "",
    descripcionViaje: "",
    presupuestoMaximoCOP: 10000000,
  },
  tasas: { ...TASAS_CONVERSION_DEFAULT },
  itinerario: [nuevoPais()],
};

/* ==========================================================================
   UTILIDADES
   ========================================================================== */

const formatearCOP = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor || 0);

const calcularCostoEnCOP = (costoLocal, moneda, tasas) => {
  const tasa = tasas[moneda] || 1;
  return (Number(costoLocal) || 0) * tasa;
};

/* ==========================================================================
   COMPONENTE PRINCIPAL
   ========================================================================== */

export const Home = () => {
  const [data, setData] = useState(ESTADO_INICIAL);
  const [guardado, setGuardado] = useState(false);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          viajero: { ...ESTADO_INICIAL.viajero, ...parsed.viajero },
          tasas: { ...TASAS_CONVERSION_DEFAULT, ...parsed.tasas },
          itinerario:
            Array.isArray(parsed.itinerario) && parsed.itinerario.length
              ? parsed.itinerario
              : [nuevoPais()],
        });
      }
    } catch (e) {
      console.error("Error cargando localStorage:", e);
    }
  }, []);

  // Guardar automáticamente en localStorage en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setGuardado(true);
      const t = setTimeout(() => setGuardado(false), 1200);
      return () => clearTimeout(t);
    } catch (e) {
      console.error("Error guardando localStorage:", e);
    }
  }, [data]);

  /* ----------------------- Handlers de VIAJERO ----------------------- */
  const updateViajero = (campo, valor) => {
    setData((prev) => ({
      ...prev,
      viajero: { ...prev.viajero, [campo]: valor },
    }));
  };

  /* ----------------------- Handlers de TASAS ------------------------- */
  const updateTasa = (moneda, valor) => {
    setData((prev) => ({
      ...prev,
      tasas: { ...prev.tasas, [moneda]: Number(valor) || 0 },
    }));
  };

  /* --------------------- Handlers de ITINERARIO ---------------------- */
  const updatePais = (idx, campo, valor) => {
    setData((prev) => {
      const itinerario = [...prev.itinerario];
      itinerario[idx] = { ...itinerario[idx], [campo]: valor };
      return { ...prev, itinerario };
    });
  };

  const updatePaisSub = (idx, seccion, campo, valor) => {
    setData((prev) => {
      const itinerario = [...prev.itinerario];
      itinerario[idx] = {
        ...itinerario[idx],
        [seccion]: { ...itinerario[idx][seccion], [campo]: valor },
      };
      return { ...prev, itinerario };
    });
  };

  const updateActividad = (idxPais, idxAct, campo, valor) => {
    setData((prev) => {
      const itinerario = [...prev.itinerario];
      const actividades = [...itinerario[idxPais].actividades];
      actividades[idxAct] = { ...actividades[idxAct], [campo]: valor };
      itinerario[idxPais] = { ...itinerario[idxPais], actividades };
      return { ...prev, itinerario };
    });
  };

  const addActividad = (idxPais) => {
    setData((prev) => {
      const itinerario = [...prev.itinerario];
      itinerario[idxPais] = {
        ...itinerario[idxPais],
        actividades: [...itinerario[idxPais].actividades, nuevaActividad()],
      };
      return { ...prev, itinerario };
    });
  };

  const removeActividad = (idxPais, idxAct) => {
    setData((prev) => {
      const itinerario = [...prev.itinerario];
      const actividades = itinerario[idxPais].actividades.filter(
        (_, i) => i !== idxAct
      );
      itinerario[idxPais] = {
        ...itinerario[idxPais],
        actividades: actividades.length ? actividades : [nuevaActividad()],
      };
      return { ...prev, itinerario };
    });
  };

  const addPais = () => {
    setData((prev) => ({
      ...prev,
      itinerario: [...prev.itinerario, nuevoPais()],
    }));
  };

  const removePais = (idx) => {
    setData((prev) => {
      const itinerario = prev.itinerario.filter((_, i) => i !== idx);
      return {
        ...prev,
        itinerario: itinerario.length ? itinerario : [nuevoPais()],
      };
    });
  };

  /* ----------------------- CÁLCULO DE PRESUPUESTO -------------------- */
  const presupuestoTotalCOP = data.itinerario.reduce((total, pais) => {
    const actLocal = pais.actividades.reduce(
      (s, a) => s + (Number(a.costoLocal) || 0),
      0
    );
    const comidaLocal = Number(pais.comidaTipica.costoLocal) || 0;
    const hotelLocal = Number(pais.hotel.costoLocal) || 0;
    const paisLocal = actLocal + comidaLocal + hotelLocal;
    return total + calcularCostoEnCOP(paisLocal, pais.moneda, data.tasas);
  }, 0);

  const dentroDelPresupuesto =
    presupuestoTotalCOP <= data.viajero.presupuestoMaximoCOP;

  /* ==========================================================================
     GENERACIÓN DE ARCHIVOS DE DESCARGA (index.html + styles.css)
     ========================================================================== */

  const descargarArchivo = (nombre, contenido, tipo) => {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generarIndexHTML = () => {
    // Se inyectan los datos actuales dentro del HTML/JS original (idéntico al ejemplo)
    const datosViajeroStr = JSON.stringify(data.viajero, null, 2);
    const tasasStr = JSON.stringify(data.tasas, null, 2);
    const itinerarioStr = JSON.stringify(data.itinerario, null, 2);

    return INDEX_HTML_TEMPLATE
      .replace("__DATOS_VIAJERO__", datosViajeroStr)
      .replace("__TASAS_CONVERSION__", tasasStr)
      .replace("__ITINERARIO__", itinerarioStr);
  };

  const descargarTodo = () => {
    descargarArchivo("index.html", generarIndexHTML(), "text/html");
    // Pequeño delay para que el navegador no bloquee la segunda descarga
    setTimeout(() => {
      descargarArchivo("styles.css", STYLES_CSS_CONTENT, "text/css");
    }, 400);
  };

  /* ==========================================================================
     RENDER DEL EDITOR
     ========================================================================== */

  return (
    <div className="editor-app">
      {/* ---------- BARRA SUPERIOR ---------- */}
      <div className="editor-topbar">
        <div className="editor-topbar-inner">
          <div>
            <h1 className="editor-logo">✈️ World Cup Journal — Editor</h1>
            <p className="editor-sub">
              Llena tus datos. Todo se guarda solo en este computador.
            </p>
          </div>
          <div className="editor-actions">
            <span className={`save-pill ${guardado ? "on" : ""}`}>
              {guardado ? "✓ Guardado" : "Guardado automático"}
            </span>
            <button className="btn-descargar" onClick={descargarTodo}>
              ⬇️ Descargar index.html + styles.css
            </button>
          </div>
        </div>
      </div>

      <div className="editor-container">
        {/* ---------- RESUMEN DE PRESUPUESTO ---------- */}
        <section className="editor-budget-summary">
          <div className="ebs-card">
            <span className="ebs-label">Presupuesto calculado</span>
            <span className="ebs-value accent">
              {formatearCOP(presupuestoTotalCOP)}
            </span>
          </div>
          <div className="ebs-card">
            <span className="ebs-label">Tu meta</span>
            <span className="ebs-value">
              {formatearCOP(data.viajero.presupuestoMaximoCOP)}
            </span>
          </div>
          <div className="ebs-card">
            <span className="ebs-label">Estado</span>
            <span
              className={`ebs-status ${dentroDelPresupuesto ? "ok" : "over"}`}
            >
              {dentroDelPresupuesto ? "✅ Dentro del presupuesto" : "⚠️ Excedido"}
            </span>
          </div>
        </section>

        {/* ---------- DATOS GENERALES ---------- */}
        <section className="editor-panel">
          <h2 className="panel-title">🧳 Información general del viaje</h2>
          <div className="grid-2">
            <label className="field">
              <span>Tu nombre</span>
              <input
                type="text"
                value={data.viajero.nombreEstudiante}
                onChange={(e) => updateViajero("nombreEstudiante", e.target.value)}
                placeholder="Escribe tu nombre"
              />
            </label>
            <label className="field">
              <span>Presupuesto máximo (COP)</span>
              <input
                type="number"
                value={data.viajero.presupuestoMaximoCOP || ""}
                onChange={(e) =>
                  updateViajero("presupuestoMaximoCOP", Number(e.target.value) || 0)
                }
                placeholder="10000000"
              />
            </label>
            <label className="field">
              <span>Título del viaje</span>
              <input
                type="text"
                value={data.viajero.tituloViaje}
                onChange={(e) => updateViajero("tituloViaje", e.target.value)}
                placeholder="Mi ruta mundialista"
              />
            </label>
            <label className="field">
              <span>Descripción del viaje</span>
              <input
                type="text"
                value={data.viajero.descripcionViaje}
                onChange={(e) => updateViajero("descripcionViaje", e.target.value)}
                placeholder="Un viaje de 7 días por..."
              />
            </label>
          </div>
        </section>

        {/* ---------- TASAS DE CONVERSIÓN ---------- */}
        <section className="editor-panel">
          <h2 className="panel-title">💱 Tasas de conversión a COP</h2>
          <div className="grid-4">
            {Object.keys(data.tasas).map((moneda) => (
              <label className="field" key={moneda}>
                <span>1 {moneda} =</span>
                <input
                  type="number"
                  value={data.tasas[moneda]}
                  onChange={(e) => updateTasa(moneda, e.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        {/* ---------- PAÍSES / ITINERARIO ---------- */}
        <section className="editor-panel">
          <div className="panel-header">
            <h2 className="panel-title">🗺️ Itinerario día a día</h2>
            <button className="btn-add-pais" onClick={addPais}>
              + Agregar país
            </button>
          </div>

          {data.itinerario.map((pais, idx) => (
            <div className="pais-block" key={idx}>
              <div className="pais-block-header">
                <h3>
                  {pais.bandera} {pais.pais || `Destino ${idx + 1}`}
                </h3>
                <button
                  className="btn-remove"
                  onClick={() => removePais(idx)}
                  title="Eliminar este país"
                >
                  🗑️ Eliminar país
                </button>
              </div>

              <div className="grid-3">
                <label className="field">
                  <span>Días (ej. Días 1 - 3)</span>
                  <input
                    type="text"
                    value={pais.dias}
                    onChange={(e) => updatePais(idx, "dias", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>País</span>
                  <input
                    type="text"
                    value={pais.pais}
                    onChange={(e) => updatePais(idx, "pais", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Bandera (emoji)</span>
                  <input
                    type="text"
                    value={pais.bandera}
                    onChange={(e) => updatePais(idx, "bandera", e.target.value)}
                    placeholder="🇧🇷"
                  />
                </label>
                <label className="field">
                  <span>Ciudad</span>
                  <input
                    type="text"
                    value={pais.ciudad}
                    onChange={(e) => updatePais(idx, "ciudad", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Idioma</span>
                  <input
                    type="text"
                    value={pais.idioma}
                    onChange={(e) => updatePais(idx, "idioma", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Moneda</span>
                  <select
                    value={pais.moneda}
                    onChange={(e) => updatePais(idx, "moneda", e.target.value)}
                  >
                    {Object.keys(data.tasas).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Link de imagen del país */}
              <label className="field img-link-field">
                <span>🖼️ Link de imagen del país (banner)</span>
                <input
                  type="url"
                  value={pais.imagenPais}
                  onChange={(e) => updatePais(idx, "imagenPais", e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {pais.imagenPais && (
                  <img
                    src={pais.imagenPais}
                    alt="preview banner"
                    className="img-preview banner"
                    onError={(e) => (e.target.style.display = "none")}
                    onLoad={(e) => (e.target.style.display = "block")}
                  />
                )}
              </label>

              {/* Actividades */}
              <div className="sub-section">
                <div className="sub-header">
                  <h4>📍 Actividades</h4>
                  <button
                    className="btn-add-mini"
                    onClick={() => addActividad(idx)}
                  >
                    + Actividad
                  </button>
                </div>

                {pais.actividades.map((act, ai) => (
                  <div className="actividad-row" key={ai}>
                    <div className="grid-act">
                      <label className="field">
                        <span>Nombre</span>
                        <input
                          type="text"
                          value={act.nombre}
                          onChange={(e) =>
                            updateActividad(idx, ai, "nombre", e.target.value)
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Descripción</span>
                        <input
                          type="text"
                          value={act.descripcion}
                          onChange={(e) =>
                            updateActividad(idx, ai, "descripcion", e.target.value)
                          }
                        />
                      </label>
                      <label className="field small">
                        <span>Costo ({pais.moneda})</span>
                        <input
                          type="number"
                          value={act.costoLocal || ""}
                          onChange={(e) =>
                            updateActividad(
                              idx,
                              ai,
                              "costoLocal",
                              Number(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                        />
                      </label>
                      <label className="field">
                        <span>🖼️ Link de imagen</span>
                        <input
                          type="url"
                          value={act.imagenActividad}
                          onChange={(e) =>
                            updateActividad(
                              idx,
                              ai,
                              "imagenActividad",
                              e.target.value
                            )
                          }
                          placeholder="https://ejemplo.com/foto.jpg"
                        />
                      </label>
                    </div>
                    <button
                      className="btn-remove-mini"
                      onClick={() => removeActividad(idx, ai)}
                      title="Eliminar actividad"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Comida típica */}
              <div className="sub-section">
                <h4>🍲 Comida típica</h4>
                <div className="grid-3">
                  <label className="field">
                    <span>Nombre</span>
                    <input
                      type="text"
                      value={pais.comidaTipica.nombre}
                      onChange={(e) =>
                        updatePaisSub(idx, "comidaTipica", "nombre", e.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Descripción</span>
                    <input
                      type="text"
                      value={pais.comidaTipica.descripcion}
                      onChange={(e) =>
                        updatePaisSub(
                          idx,
                          "comidaTipica",
                          "descripcion",
                          e.target.value
                        )
                      }
                    />
                  </label>
                  <label className="field small">
                    <span>Costo ({pais.moneda})</span>
                    <input
                      type="number"
                      value={pais.comidaTipica.costoLocal || ""}
                      onChange={(e) =>
                        updatePaisSub(
                          idx,
                          "comidaTipica",
                          "costoLocal",
                          Number(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </label>
                </div>
              </div>

              {/* Hotel */}
              <div className="sub-section">
                <h4>🏨 Hotel / Hospedaje</h4>
                <div className="grid-3">
                  <label className="field">
                    <span>Nombre</span>
                    <input
                      type="text"
                      value={pais.hotel.nombre}
                      onChange={(e) =>
                        updatePaisSub(idx, "hotel", "nombre", e.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Descripción</span>
                    <input
                      type="text"
                      value={pais.hotel.descripcion}
                      onChange={(e) =>
                        updatePaisSub(idx, "hotel", "descripcion", e.target.value)
                      }
                    />
                  </label>
                  <label className="field small">
                    <span>Costo ({pais.moneda})</span>
                    <input
                      type="number"
                      value={pais.hotel.costoLocal || ""}
                      onChange={(e) =>
                        updatePaisSub(
                          idx,
                          "hotel",
                          "costoLocal",
                          Number(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </label>
                </div>
              </div>

              {/* Camiseta */}
              <div className="sub-section">
                <h4>👕 Camiseta recomendada</h4>
                <div className="grid-2">
                  <label className="field">
                    <span>Nombre</span>
                    <input
                      type="text"
                      value={pais.camisetaFavorita.nombre}
                      onChange={(e) =>
                        updatePaisSub(
                          idx,
                          "camisetaFavorita",
                          "nombre",
                          e.target.value
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Descripción</span>
                    <input
                      type="text"
                      value={pais.camisetaFavorita.descripcion}
                      onChange={(e) =>
                        updatePaisSub(
                          idx,
                          "camisetaFavorita",
                          "descripcion",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Botón para agregar otro país justo debajo de este */}
              <div className="pais-block-footer">
                <button className="btn-add-pais-block" onClick={addPais}>
                  + Agregar otro país
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* ---------- DESCARGA FINAL ---------- */}
        <section className="editor-panel download-panel">
          <h2 className="panel-title">🚀 Publicar en Netlify</h2>
          <p className="download-help">
            Descarga los dos archivos y arrástralos juntos a Netlify Drop. El{" "}
            <strong>index.html</strong> queda idéntico al diseño original con tu
            información, y el <strong>styles.css</strong> es el estilo del
            ejemplo. Recuerda pegar <strong>links de imágenes</strong> (URLs) en
            los campos de imagen.
          </p>
          <button className="btn-descargar big" onClick={descargarTodo}>
            ⬇️ Descargar index.html + styles.css
          </button>
        </section>
      </div>
    </div>
  );
};


/* ==========================================================================
   CONTENIDO EMBEBIDO: styles.css e index.html (se descargan idénticos al ejemplo)
   ========================================================================== */

const STYLES_CSS_CONTENT = `/* ==========================================================================
   ESTILOS BITÁCORA DE VIAJES MUNDIALISTA - OPTIMIZADO PARA HTML/JS NATIVO
   ========================================================================== */

:root {
  --primary-color: #1a365d;
  --secondary-color: #319795;
  --accent-color: #d69e2e;
  --bg-app: #f7fafc;
  --text-dark: #2d3748;
  --text-light: #718096;
  --card-bg: #ffffff;
}

body {
  background-color: var(--bg-app);
  color: var(--text-dark);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
}

.travel-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.travel-header {
  background: linear-gradient(135deg, rgba(26, 54, 93, 0.95), rgba(49, 151, 149, 0.9)),
              url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: #ffffff;
  padding: 80px 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.header-overlay {
  max-width: 800px;
  margin: 0 auto;
}

.badge-tag {
  background-color: var(--accent-color);
  color: #fff;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.travel-header h1 {
  font-size: 3rem;
  margin: 20px 0 10px 0;
  font-weight: 800;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.travel-header .subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.traveler-meta span {
  background-color: rgba(255, 255, 255, 0.15);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
}

.travel-container {
  max-width: 1000px;
  width: 100%;
  margin: -40px auto 40px auto;
  padding: 0 20px;
  box-sizing: border-box;
  flex: 1;
}

.budget-widget {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  margin-bottom: 40px;
}

.budget-widget h2 {
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--primary-color);
  border-bottom: 2px solid #edf2f7;
  padding-bottom: 10px;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.budget-card {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.budget-card h3 {
  font-size: 0.9rem;
  color: var(--text-light);
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.budget-value {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary-color);
}

.text-accent {
  color: var(--secondary-color);
}

.status-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.status-badge {
  font-weight: bold;
  padding: 8px 16px;
  border-radius: 50px;
  margin: 0;
}

.status-badge.success {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-badge.danger {
  background-color: #fed7d7;
  color: #742a2a;
}

.itinerary-timeline {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.8rem;
  color: var(--primary-color);
  margin-bottom: 30px;
}

.timeline-wrapper {
  position: relative;
  padding-left: 30px;
  border-left: 4px solid var(--secondary-color);
}

.timeline-item {
  position: relative;
  margin-bottom: 50px;
}

.timeline-date {
  position: absolute;
  left: -54px;
  top: 15px;
  z-index: 10;
}

.date-badge {
  background: var(--secondary-color);
  color: white;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(49, 151, 149, 0.4);
  white-space: nowrap;
}

.timeline-card {
  background: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.timeline-card:hover {
  transform: translateY(-5px);
}

.card-banner {
  height: 220px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.card-banner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 100%);
}

.banner-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  color: white;
}

.banner-content h3 {
  font-size: 2rem;
  margin: 0;
  font-weight: 700;
}

.destination-meta {
  margin: 5px 0 0 0;
  opacity: 0.9;
  font-size: 1rem;
}

.card-body {
  padding: 24px;
}

.currency-info-box {
  background: #edf2f7;
  padding: 12px 18px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.currency-info-box p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.details-section {
  margin-top: 25px;
}

.details-section h4 {
  font-size: 1.1rem;
  color: var(--primary-color);
  margin-top: 0;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.border-top {
  border-top: 1px solid #edf2f7;
  padding-top: 20px;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.activity-mini-card {
  display: flex;
  background: #f8fafc;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  min-height: 90px;
}

.activity-thumb {
  width: 90px;
  min-width: 90px;
  height: auto;
  object-fit: cover;
}

.activity-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
}

.activity-info h5 {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  color: var(--text-dark);
}

.activity-info p {
  margin: 0 0 8px 0;
  font-size: 0.8rem;
  color: var(--text-light);
  line-height: 1.3;
}

.price-tag {
  background-color: #e2e8f0;
  color: var(--primary-color);
  font-size: 0.8rem;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 4px;
  align-self: flex-start;
}

.gastronomy-box {
  background: #fffaf0;
  border: 1px solid #feebc8;
  padding: 16px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.details-section:nth-of-type(4) .gastronomy-box {
  background: #f0fff4;
  border: 1px solid #c6f6d5;
}

.gastronomy-box h5 {
  margin: 0 0 4px 0;
  color: #dd6b20;
  font-size: 1rem;
}

.details-section:nth-of-type(4) .gastronomy-box h5 {
  color: #22543d;
}

.gastronomy-box p {
  margin: 0;
  font-size: 0.85rem;
  color: #7b341e;
  line-height: 1.3;
}

.details-section:nth-of-type(4) .gastronomy-box p {
  color: #234e52;
}

.jersey-section {
  background: #ebf8ff;
  border: 1px solid #bee3f8;
  padding: 15px;
  border-radius: 10px;
  color: #2b6cb0;
  line-height: 1.4;
}

.card-footer-cost {
  margin-top: 24px;
  background-color: var(--primary-color);
  color: white;
  padding: 14px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
}

.travel-footer-app {
  text-align: center;
  padding: 30px;
  background-color: var(--primary-color);
  color: #a0aec0;
  font-size: 0.9rem;
  margin-top: auto;
}

@media (max-width: 768px) {
  .travel-header { padding: 60px 15px; }
  .travel-header h1 { font-size: 2.2rem; }
  .travel-container { margin-top: -20px; padding: 0 15px; }
  .budget-grid { grid-template-columns: 1fr; gap: 15px; }
  .currency-info-box { flex-direction: column; align-items: flex-start; gap: 8px; }
  .card-banner { height: 180px; }
  .banner-content h3 { font-size: 1.6rem; }
}

@media (max-width: 576px) {
  .travel-header { padding: 50px 10px; }
  .travel-header h1 { font-size: 1.8rem; }
  .travel-header .subtitle { font-size: 1rem; }
  .timeline-wrapper { padding-left: 0; border-left: none; }
  .timeline-item { margin-bottom: 40px; }
  .timeline-date { position: static; margin-bottom: 12px; display: inline-block; }
  .card-body { padding: 16px; }
  .activity-mini-card { flex-direction: column; }
  .activity-thumb { width: 100%; height: 140px; }
  .gastronomy-box { flex-direction: column; align-items: flex-start; gap: 12px; }
  .card-footer-cost { flex-direction: column; gap: 6px; text-align: center; font-size: 1rem; padding: 12px; }
}
`;

const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>World Cup Travel Journal</title>
    
    <!-- CONEXIÓN AL CSS: Ya queda enlazado para cuando hagas el drag and drop -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <div class="travel-app">
        <!-- HEADER HERO -->
        <header class="travel-header">
            <div class="header-overlay">
                <span class="badge-tag">✈️ World Cup Travel Journal</span>
                <h1 id="hero-titulo">Cargando Título...</h1>
                <p class="subtitle" id="hero-descripcion">Cargando Descripción...</p>
                <div class="traveler-meta">
                    <span>Created by: <strong id="hero-estudiante">Estudiante</strong></span>
                </div>
            </div>
        </header>

        <main class="travel-container">
            <!-- GLOBAL BUDGET WIDGET -->
            <section class="budget-widget">
                <h2>📊 Itinerary Expenses Summary</h2>
                <div class="budget-grid">
                    <div class="budget-card">
                        <h3>Calculated Budget (Total COP)</h3>
                        <p class="budget-value text-accent" id="presupuesto-calculado">$0</p>
                    </div>
                    <div class="budget-card">
                        <h3>Student's Goal</h3>
                        <p class="budget-value" id="presupuesto-meta">$0</p>
                    </div>
                    <div class="budget-card status-card">
                        <h3>Budget Status</h3>
                        <div id="presupuesto-status">
                            <!-- El badge de estado se genera dinámicamente -->
                        </div>
                    </div>
                </div>
            </section>

            <!-- INTERACTIVE TIMELINE / ITINERARY -->
            <section class="itinerary-timeline">
                <h2 class="section-title">🗺️ Your 7-Day Route</h2>
                
                <!-- Aquí se inyectarán las tarjetas de los países de forma automática -->
                <div class="timeline-wrapper" id="timeline-contenedor"></div>
            </section>
        </main>

        <footer class="travel-footer-app">
            <p>Made with ❤️ in the Programming & Finance class. Safe travels!</p>
        </footer>
    </div>

    <!-- ========================================================= -->
    <!-- LÓGICA DE PROGRAMACIÓN Y FINANZAS (SECCIÓN CONFIGURABLE)   -->
    <!-- ========================================================= -->
    <script>
        // 1. INFORMACIÓN GENERAL DEL VIAJE
        const DATOS_VIAJERO = __DATOS_VIAJERO__;

        // 2. MONEDAS Y CONVERSIONES (Tasa de cambio a Pesos Colombianos - COP)
        const TASAS_CONVERSION = __TASAS_CONVERSION__;

        // 3. ITINERARIO DE 7 DÍAS (Día a Día)
        const ITINERARIO = __ITINERARIO__;

        // ==========================================
        // PROCESADOR AUTOMÁTICO (NO MODIFICAR)
        // ==========================================

        // Función matemática de conversión
        const calcularCostoEnCOP = (costoLocal, moneda) => {
            const tasa = TASAS_CONVERSION[moneda] || 1;
            return costoLocal * tasa;
        };

        // Formateador de pesos colombianos
        const formatearCOP = (valor) => {
            return new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0
            }).format(valor);
        };

        // Renderizar encabezados informativos
        document.getElementById("hero-titulo").innerText = DATOS_VIAJERO.tituloViaje;
        document.getElementById("hero-descripcion").innerText = DATOS_VIAJERO.descripcionViaje;
        document.getElementById("hero-estudiante").innerText = DATOS_VIAJERO.nombreEstudiante;
        document.getElementById("presupuesto-meta").innerText = formatearCOP(DATOS_VIAJERO.presupuestoMaximoCOP);

        // Inicializar acumuladores e inyección de tarjetas
        let presupuestoTotalCOP = 0;
        const contenedor = document.getElementById("timeline-contenedor");

        ITINERARIO.forEach((item) => {
            // Calcular totales locales por país de forma segura
            const totalActividadesLocal = item.actividades.reduce((sum, act) => sum + act.costoLocal, 0);
            const totalComidaLocal = item.comidaTipica ? item.comidaTipica.costoLocal : 0;
            const totalHotelLocal = item.hotel ? item.hotel.costoLocal : 0;
            
            const totalPaisLocal = totalActividadesLocal + totalComidaLocal + totalHotelLocal;
            const totalPaisCOP = calcularCostoEnCOP(totalPaisLocal, item.moneda);
            
            // Sumar al presupuesto global acumulado
            presupuestoTotalCOP += totalPaisCOP;

            // Generar la grilla de actividades dinámicamente
            let actividadesHTML = "";
            item.actividades.forEach(act => {
                const imgThumb = act.imagenActividad || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=150";
                actividadesHTML += \`
                    <div class="activity-mini-card">
                        <img src="\${imgThumb}" alt="\${act.nombre}" class="activity-thumb" />
                        <div class="activity-info">
                            <h5>\${act.nombre}</h5>
                            <p>\${act.descripcion}</p>
                            <span class="price-tag">
                                \${act.costoLocal} \${item.moneda} (~ \${formatearCOP(calcularCostoEnCOP(act.costoLocal, item.moneda))})
                            </span>
                        </div>
                    </div>
                \`;
            });

            // Estructura de la tarjeta del país
            const cardHTML = \`
                <div class="timeline-item">
                    <div class="timeline-date">
                        <span class="date-badge">\${item.dias}</span>
                    </div>

                    <div class="timeline-card">
                        <div class="card-banner" style="background-image: url('\${item.imagenPais || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600'}')">
                            <div class="banner-content">
                                <h3>\${item.bandera} \${item.pais}</h3>
                                <p class="destination-meta">\${item.ciudad} | 🗣️ \${item.idioma}</p>
                            </div>
                        </div>

                        <div class="card-body">
                            <div class="currency-info-box">
                                <p>💵 <strong>Local Currency:</strong> \${item.moneda}</p>
                                <p>🔄 <strong>Exchange Rate:</strong> 1 \${item.moneda} = \${formatearCOP(TASAS_CONVERSION[item.moneda] || 1)}</p>
                            </div>

                            <div class="details-section">
                                <h4>📍 Itinerary Activities</h4>
                                <div class="activities-grid">
                                    \${actividadesHTML}
                                </div>
                            </div>

                            <div class="details-section border-top">
                                <h4>🍲 What will we eat?</h4>
                                <div class="gastronomy-box">
                                    <div>
                                        <h5>\${item.comidaTipica.nombre || 'Comida típica'}</h5>
                                        <p>\${item.comidaTipica.descripcion || 'Sin descripción'}</p>
                                    </div>
                                    <span class="price-tag">
                                        \${item.comidaTipica.costoLocal} \${item.moneda} (~ \${formatearCOP(calcularCostoEnCOP(item.comidaTipica.costoLocal, item.moneda))})
                                    </span>
                                </div>
                            </div>

                            <div class="details-section border-top">
                                <h4>🏨 Where will we be staying?</h4>
                                <div class="gastronomy-box">
                                    <div>
                                        <h5>\${item.hotel.nombre || 'Hotel de estadía'}</h5>
                                        <p>\${item.hotel.descripcion || 'Sin descripción'}</p>
                                    </div>
                                    <span class="price-tag">
                                        \${item.hotel.costoLocal} \${item.moneda} (~ \${formatearCOP(calcularCostoEnCOP(item.hotel.costoLocal, item.moneda))})
                                    </span>
                                </div>
                            </div>

                            <div class="details-section border-top jersey-section">
                                <h4>👕 Recommended World Cup Jersey</h4>
                                <p><strong>\${item.camisetaFavorita.nombre || 'Camiseta'}:</strong> \${item.camisetaFavorita.descripcion || 'Sin detalles'}</p>
                            </div>

                            <div class="card-footer-cost">
                                <span>Subtotal spent in \${item.pais}:</span>
                                <strong>\${formatearCOP(totalPaisCOP)} COP</strong>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
            contenedor.innerHTML += cardHTML;
        });

        // Actualizar el Widget de presupuesto global una vez procesados los datos
        document.getElementById("presupuesto-calculado").innerText = formatearCOP(presupuestoTotalCOP);
        
        const statusContenedor = document.getElementById("presupuesto-status");
        if (presupuestoTotalCOP <= DATOS_VIAJERO.presupuestoMaximoCOP) {
            statusContenedor.innerHTML = \`<p class="status-badge success">✅ Within Budget!</p>\`;
        } else {
            statusContenedor.innerHTML = \`<p class="status-badge danger">⚠️ Limit Exceeded!</p>\`;
        }
    </script>
</body>
</html>`;

export default Home;
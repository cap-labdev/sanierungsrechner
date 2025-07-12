import { useEffect, useState } from "react";

export default function App() {
  const SHEET_ID = "18KDQCs4ZjVfrpgFe4nq3_P3zwR37MoqNJVPCBW-8cOI";
  const GEWERKE_SHEET = "gewerke";
  const FENSTER_SHEET = "fenster_daten";

  const [gewerke, setGewerke] = useState([]);
  const [selectedGewerk, setSelectedGewerk] = useState("");
  const [checkboxAusbau, setCheckboxAusbau] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const [hoehe, setHoehe] = useState("");
  const [breite, setBreite] = useState("");
  const [material, setMaterial] = useState("Holz");
  const [fensterDaten, setFensterDaten] = useState({});
  const [ergebnisse, setErgebnisse] = useState(null);

  function buildSheetUrl(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  }

  useEffect(() => {
    fetch(buildSheetUrl(GEWERKE_SHEET))
      .then((res) => res.text())
      .then((text) => {
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;
        const gewerkeListe = rows.map((row) => row.c[0].v);
        setGewerke(gewerkeListe);
        setSelectedGewerk(gewerkeListe[0] || "");
      })
      .catch(() => alert("Fehler beim Laden der Gewerke."));
  }, []);

  useEffect(() => {
    if (selectedGewerk === "Fenster") {
      fetch(buildSheetUrl(FENSTER_SHEET))
        .then((res) => res.text())
        .then((text) => {
          const json = JSON.parse(text.substr(47).slice(0, -2));
          const rows = json.table.rows;
          const daten = {};

          rows.forEach((row) => {
            const key = row.c[0]?.v?.toLowerCase();
            if (!key) return;
            daten[key] = {
              holz: parseFloat(row.c[1]?.v || 0),
              alu: parseFloat(row.c[2]?.v || 0),
              kunststoff: parseFloat(row.c[3]?.v || 0),
            };
          });

          setFensterDaten(daten);
        })
        .catch(() => alert("Fehler beim Laden der Fensterdaten."));
    }
  }, [selectedGewerk]);

  useEffect(() => {
    if (selectedGewerk !== "Fenster") {
      setErgebnisse(null);
      return;
    }

    const h = parseFloat(hoehe) || 0;
    const b = parseFloat(breite) || 0;
    const m2 = (h * b) / 10000;

    const matKeys = ["holz", "alu", "kunststoff"];
    const results = {};

    matKeys.forEach((mat) => {
      const grundpreis = fensterDaten["preis_pro_m2"]?.[mat] || 0;
      const handwerk = fensterDaten["handwerkskosten_m2"]?.[mat] || 0;
      const schlagduebelAnz = m2 * (fensterDaten["schlagduebel_m2"]?.[mat] || 0);
      const schlagduebelPreis = (fensterDaten["preis_schlagduebel"]?.[mat] || 0) * schlagduebelAnz;
      const silikonLiter = m2 * (fensterDaten["silikon_m2"]?.[mat] || 0);
      const silikonPreis = silikonLiter * (fensterDaten["preis_silikon"]?.[mat] || 0);
      const ausbau = checkboxAusbau ? fensterDaten["ausbau und entsorgung alt"]?.[mat] || 0 : 0;

      const gesamt = m2 * (grundpreis + handwerk) + schlagduebelPreis + silikonPreis + ausbau;
      results[mat] = gesamt;
    });

    setErgebnisse(results);
  }, [hoehe, breite, fensterDaten, checkboxAusbau, selectedGewerk]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1>Sanierungskosten-Rechner</h1>

      <label>
        Was willst du sanieren?{" "}
        <select value={selectedGewerk} onChange={(e) => setSelectedGewerk(e.target.value)}>
          {gewerke.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 10 }}>
        <label style={{ display: "flex", alignItems: "center" }}>
          <input type="checkbox" checked={checkboxAusbau} onChange={() => setCheckboxAusbau(!checkboxAusbau)} style={{ marginRight: 8 }} />
          Kostenschätzung inkl. Ausbau und Entsorgung des alten Bestandes
          <div
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            style={{ marginLeft: 8, width: 18, height: 18, borderRadius: "50%", backgroundColor: "#ccc", textAlign: "center", fontWeight: "bold", cursor: "default" }}
          >?
            {tooltipVisible && (
              <div style={{ position: "absolute", backgroundColor: "white", border: "1px solid #999", padding: 10, maxWidth: 300, marginTop: 5, zIndex: 10 }}>
                Die Kostenschätzung geht davon aus, dass ein alter Fensterbestand ausgebaut und entsorgt wird.
              </div>
            )}
          </div>
        </label>
      </div>

      {selectedGewerk === "Fenster" && (
        <div style={{ marginTop: 20 }}>
          <h2>Fenster Maße</h2>
          <label>Höhe (cm): <input type="number" value={hoehe} onChange={(e) => setHoehe(e.target.value)} /></label><br />
          <label>Breite (cm): <input type="number" value={breite} onChange={(e) => setBreite(e.target.value)} /></label><br />
        </div>
      )}

      {ergebnisse && (
        <div style={{ marginTop: 30, padding: 15, border: "1px solid #ddd", borderRadius: 5, backgroundColor: "#17094aff" }}>
          <h3>Deine Kostenschätzung (inkl. Toleranz ±15%)</h3>
          <ul>
            <li>Holz: ca. <strong>{ergebnisse.holz.toFixed(2)} €</strong></li>
            <li>Alu: ca. <strong>{ergebnisse.alu.toFixed(2)} €</strong></li>
            <li>Kunststoff: ca. <strong>{ergebnisse.kunststoff.toFixed(2)} €</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
}

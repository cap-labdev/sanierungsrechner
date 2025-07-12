import { useEffect, useState } from "react";

export default function App() {
  const SHEET_ID = "18KDQCs4ZjVfrpgFe4nq3_P3zwR37MoqNJVPCBW-8cOI";
  const GEWERKE_SHEET = "gewerke";
  const FENSTER_SHEET = "fenster_daten";

  const [gewerke, setGewerke] = useState([]);
  const [selectedGewerk, setSelectedGewerk] = useState("");
  const [checkboxAusbau, setCheckboxAusbau] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Fenster-Eingaben
  const [flaeche, setFlaeche] = useState("");
  const [schlagduebel, setSchlagduebel] = useState("");
  const [silikon, setSilikon] = useState("");

  // Preise aus Sheet
  const [fensterDaten, setFensterDaten] = useState({});

  // Ergebnis
  const [ergebnis, setErgebnis] = useState(null);
  const [toleranz, setToleranz] = useState({ plus: 15, minus: 10 }); // %

  // Hilfsfunktion zum Sheets-API-URL bauen
  function buildSheetUrl(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  }

  // Gewerke laden
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
      .catch(() => alert("Fehler beim Laden der Gewerke aus Google Sheets."));
  }, []);

  // Fenster Daten laden
  useEffect(() => {
    if (selectedGewerk === "Fenster") {
      fetch(buildSheetUrl(FENSTER_SHEET))
        .then((res) => res.text())
        .then((text) => {
          const json = JSON.parse(text.substr(47).slice(0, -2));
          const rows = json.table.rows;
          const daten = {};
          rows.forEach((row) => {
            const key = row.c[0]?.v || "";
            const wert = parseFloat(row.c[2]?.v || 0);
            daten[key.toLowerCase()] = wert;
          });
          setFensterDaten(daten);
        })
        .catch(() => alert("Fehler beim Laden der Fenster-Daten."));
    }
  }, [selectedGewerk]);

  // Berechnung
  useEffect(() => {
    if (selectedGewerk !== "Fenster") {
      setErgebnis(null);
      return;
    }

    // Eingaben in Zahlen wandeln
    const fl = parseFloat(flaeche) || 0;
    const sd = parseFloat(schlagduebel) || 0;
    const si = parseFloat(silikon) || 0;
    const ausbau = checkboxAusbau ? fensterDaten["ausbau und entsorgung alt"] || 0 : 0;

    // Beispiel Berechnung: Basisfläche * Preis/m2 + Ausbau + Schlagdübel + Silikon
    // (Du kannst die Formel noch anpassen, das ist ein Prototyp)
    const basisPreis = fensterDaten["fläche"] || 0;
    const preis = fl * basisPreis + ausbau + sd * (fensterDaten["schlagdübel"] || 0) + si * (fensterDaten["silikon"] || 0);

    setErgebnis(preis);
  }, [flaeche, schlagduebel, silikon, checkboxAusbau, fensterDaten, selectedGewerk]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1>Sanierungskosten-Rechner (Prototyp)</h1>

      <label>
        Was willst du sanieren?{" "}
        <select value={selectedGewerk} onChange={(e) => setSelectedGewerk(e.target.value)}>
          {gewerke.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 10 }}>
        <label style={{ display: "flex", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={checkboxAusbau}
            onChange={() => setCheckboxAusbau(!checkboxAusbau)}
            style={{ marginRight: 8 }}
          />
          Kostenschätzung inkl. Ausbau und Entsorgung des alten Bestandes
          <div
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            style={{
              marginLeft: 8,
              display: "inline-block",
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: "#ccc",
              color: "#333",
              textAlign: "center",
              cursor: "default",
              fontWeight: "bold",
            }}
          >
            ?
            {tooltipVisible && (
              <div
                style={{
                  position: "absolute",
                  backgroundColor: "white",
                  border: "1px solid #999",
                  padding: 10,
                  maxWidth: 300,
                  marginTop: 5,
                  zIndex: 10,
                }}
              >
                Die Kostenschätzung geht davon aus, dass ein alter Fensterbestand ausgebaut und entsorgt wird.
                Wird nur das Fensterloch neu genutzt (Neubau), fallen diese Kosten nicht an.
              </div>
            )}
          </div>
        </label>
      </div>

      {selectedGewerk === "Fenster" && (
        <div style={{ marginTop: 20 }}>
          <h2>Fenster Eingaben</h2>

          <label>
            Fläche (m2):{" "}
            <input
              type="number"
              min="0"
              step="0.01"
              value={flaeche}
              onChange={(e) => setFlaeche(e.target.value)}
            />
          </label>
          <br />
          <label>
            Anzahl Schlagdübel:{" "}
            <input
              type="number"
              min="0"
              value={schlagduebel}
              onChange={(e) => setSchlagduebel(e.target.value)}
            />
          </label>
          <br />
          <label>
            Anzahl Silikon-Kartuschen:{" "}
            <input
              type="number"
              min="0"
              value={silikon}
              onChange={(e) => setSilikon(e.target.value)}
            />
          </label>
        </div>
      )}

      {ergebnis !== null && (
        <div style={{ marginTop: 30, padding: 15, border: "1px solid #ddd", borderRadius: 5, backgroundColor: "#f9f9f9" }}>
          <h3>Deine Kostenschätzung</h3>
          <p>
            Ca. <strong>{ergebnis.toFixed(2)} €</strong> (± {toleranz.plus}% / -{toleranz.minus}%)<br />
            (inkl. Ausbau: {checkboxAusbau ? "Ja" : "Nein"})
          </p>
        </div>
      )}
    </div>
  );
}

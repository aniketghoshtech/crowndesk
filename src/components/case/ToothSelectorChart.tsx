import React from 'react';

interface ToothSelectorChartProps {
  selectedTeeth: string[];
  onChange: (teeth: string[]) => void;
  serviceName?: string;
}

export const ToothSelectorChart: React.FC<ToothSelectorChartProps> = ({
  selectedTeeth,
  onChange,
  serviceName = 'Crown'
}) => {
  // Universal FDI Quadrants:
  // Quadrant 1 (Upper Right): 18, 17, 16, 15, 14, 13, 12, 11
  // Quadrant 2 (Upper Left):  21, 22, 23, 24, 25, 26, 27, 28
  // Quadrant 4 (Lower Right): 48, 47, 46, 45, 44, 43, 42, 41
  // Quadrant 3 (Lower Left):  31, 32, 33, 34, 35, 36, 37, 38

  const q1 = ['18', '17', '16', '15', '14', '13', '12', '11'];
  const q2 = ['21', '22', '23', '24', '25', '26', '27', '28'];
  const q4 = ['48', '47', '46', '45', '44', '43', '42', '41'];
  const q3 = ['31', '32', '33', '34', '35', '36', '37', '38'];

  const toggleTooth = (num: string) => {
    if (selectedTeeth.includes(num)) {
      onChange(selectedTeeth.filter(t => t !== num));
    } else {
      onChange([...selectedTeeth, num]);
    }
  };

  const selectAll = (teethToSelect: string[]) => {
    const combined = Array.from(new Set([...selectedTeeth, ...teethToSelect]));
    onChange(combined);
  };

  const clearSelection = () => {
    onChange([]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Interactive Tooth Selection Chart (FDI)</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-medium">
              {selectedTeeth.length} {selectedTeeth.length === 1 ? 'Unit' : 'Units'} Selected
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Click individual teeth or use quick quadrant selectors.</p>
        </div>

        {/* Quick Selection Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => selectAll(['13', '12', '11', '21', '22', '23'])}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Upper Anterior (6)
          </button>
          <button
            type="button"
            onClick={() => selectAll(['16', '15', '14', '24', '25', '26'])}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Upper Premolars/Molars
          </button>
          <button
            type="button"
            onClick={() => selectAll(['46', '45', '44', '34', '35', '36'])}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Lower Premolars/Molars
          </button>
          {selectedTeeth.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg transition"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Upper Arch (Maxilla) */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 text-center">
          MAXILLARY ARCH (UPPER JAW)
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 bg-slate-950/60 p-3 sm:p-4 rounded-xl border border-slate-800/80">
          {/* Upper Right Quadrant */}
          <div>
            <div className="text-[10px] font-bold text-cyan-400/80 text-right pr-1 mb-1.5">Quadrant 1 (Upper Right)</div>
            <div className="flex justify-end gap-1 sm:gap-1.5">
              {q1.map(num => {
                const isSelected = selectedTeeth.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggleTooth(num)}
                    className={`w-7 h-10 sm:w-9 sm:h-12 flex flex-col items-center justify-between py-1 rounded-lg border text-xs font-bold transition-all transform active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] opacity-75 font-normal">#</span>
                    <span>{num}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upper Left Quadrant */}
          <div>
            <div className="text-[10px] font-bold text-cyan-400/80 text-left pl-1 mb-1.5">Quadrant 2 (Upper Left)</div>
            <div className="flex justify-start gap-1 sm:gap-1.5">
              {q2.map(num => {
                const isSelected = selectedTeeth.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggleTooth(num)}
                    className={`w-7 h-10 sm:w-9 sm:h-12 flex flex-col items-center justify-between py-1 rounded-lg border text-xs font-bold transition-all transform active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] opacity-75 font-normal">#</span>
                    <span>{num}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Center Divider / Occlusal Plane */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="border-t border-dashed border-slate-700 w-full" />
        <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
          OCCLUSAL MIDLINE
        </span>
      </div>

      {/* Lower Arch (Mandible) */}
      <div>
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 text-center">
          MANDIBULAR ARCH (LOWER JAW)
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 bg-slate-950/60 p-3 sm:p-4 rounded-xl border border-slate-800/80">
          {/* Lower Right Quadrant */}
          <div>
            <div className="flex justify-end gap-1 sm:gap-1.5">
              {q4.map(num => {
                const isSelected = selectedTeeth.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggleTooth(num)}
                    className={`w-7 h-10 sm:w-9 sm:h-12 flex flex-col items-center justify-between py-1 rounded-lg border text-xs font-bold transition-all transform active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                    <span>{num}</span>
                    <span className="text-[9px] opacity-75 font-normal">#</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] font-bold text-cyan-400/80 text-right pr-1 mt-1.5">Quadrant 4 (Lower Right)</div>
          </div>

          {/* Lower Left Quadrant */}
          <div>
            <div className="flex justify-start gap-1 sm:gap-1.5">
              {q3.map(num => {
                const isSelected = selectedTeeth.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => toggleTooth(num)}
                    className={`w-7 h-10 sm:w-9 sm:h-12 flex flex-col items-center justify-between py-1 rounded-lg border text-xs font-bold transition-all transform active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                    <span>{num}</span>
                    <span className="text-[9px] opacity-75 font-normal">#</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] font-bold text-cyan-400/80 text-left pl-1 mt-1.5">Quadrant 3 (Lower Left)</div>
          </div>
        </div>
      </div>

      {/* Selected list badge summary */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-slate-400">
          Selected Units:{' '}
          <span className="text-cyan-300 font-bold">
            {selectedTeeth.length > 0 ? selectedTeeth.sort().join(', ') : 'None (Click teeth above)'}
          </span>
        </div>
        <div className="text-slate-400">
          Service: <span className="text-slate-200 font-semibold">{serviceName}</span>
        </div>
      </div>
    </div>
  );
};

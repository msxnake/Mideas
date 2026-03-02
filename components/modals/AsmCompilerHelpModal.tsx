import React from 'react';
import { Button } from '../common/Button';

interface AsmCompilerHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AsmCompilerHelpModal: React.FC<AsmCompilerHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asmCompilerHelpTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn pixel-font flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="asmCompilerHelpTitle" className="text-lg text-msx-highlight mb-4">
          ASM Compiler — Setup Guide
        </h2>

        <div className="overflow-y-auto flex-grow space-y-5 text-sm font-sans pr-1">

          {/* Section: What is glass.jar */}
          <section>
            <h3 className="text-msx-accent font-bold mb-1">What is glass.jar?</h3>
            <p className="text-msx-textprimary leading-relaxed">
              <strong>Glass</strong> is a free, open source <strong>Z80 cross-assembler</strong> written in Java.
              It converts Z80 assembly code (.asm files) into binary ROM files you can run on MSX hardware or emulators.
              Mideas uses Glass internally to compile your game projects.
            </p>
          </section>

          {/* Section: Prerequisites */}
          <section>
            <h3 className="text-msx-accent font-bold mb-1">Step 1 — Install Java</h3>
            <p className="text-msx-textprimary leading-relaxed mb-2">
              Glass requires <strong>Java 8 or newer</strong>. If you don't have Java installed, download it first:
            </p>
            <a
              href="https://adoptium.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-msx-highlight underline hover:opacity-80"
            >
              https://adoptium.net/ — Eclipse Adoptium (free Java, all platforms)
            </a>
            <p className="text-msx-textsecondary mt-2 text-xs">
              To verify Java is installed, open a terminal and run:
            </p>
            <pre className="bg-msx-bgcolor text-msx-textprimary text-xs rounded p-2 mt-1 font-mono">
              java -version
            </pre>
            <p className="text-msx-textsecondary text-xs mt-1">
              You should see something like: <em>openjdk version "21.0.x"</em>
            </p>
          </section>

          {/* Section: Download glass.jar */}
          <section>
            <h3 className="text-msx-accent font-bold mb-1">Step 2 — Download glass.jar</h3>
            <p className="text-msx-textprimary leading-relaxed mb-2">
              Download the latest <code className="bg-msx-bgcolor px-1 rounded">glass.jar</code> from the official project page:
            </p>
            <a
              href="https://www.grauw.nl/projects/glass/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-msx-highlight underline hover:opacity-80 block"
            >
              https://www.grauw.nl/projects/glass/
            </a>
            <a
              href="https://github.com/grauw/glass"
              target="_blank"
              rel="noopener noreferrer"
              className="text-msx-highlight underline hover:opacity-80 block mt-1"
            >
              https://github.com/grauw/glass — GitHub (source code)
            </a>
            <p className="text-msx-textsecondary text-xs mt-2">
              Save <code className="bg-msx-bgcolor px-1 rounded">glass.jar</code> to a folder you remember, for example <code className="bg-msx-bgcolor px-1 rounded">C:\tools\glass.jar</code>
            </p>
            <div className="bg-msx-highlight bg-opacity-10 border border-msx-highlight rounded p-2 mt-2 text-xs text-msx-textprimary">
              Mideas already includes <code>glass.jar</code> in <code>server/glass.jar</code> — no extra install needed for Mideas export to work.
            </div>
          </section>

          {/* Section: Using glass.jar */}
          <section>
            <h3 className="text-msx-accent font-bold mb-1">Step 3 — Compile your ASM file</h3>
            <p className="text-msx-textprimary leading-relaxed mb-1">
              Open a terminal in the folder where your .asm file is and run:
            </p>
            <pre className="bg-msx-bgcolor text-msx-textprimary text-xs rounded p-2 font-mono whitespace-pre-wrap">
{`java -jar glass.jar mygame.asm mygame.rom`}
            </pre>
            <ul className="text-msx-textsecondary text-xs mt-2 space-y-1 ml-3">
              <li><code className="bg-msx-bgcolor px-1 rounded">mygame.asm</code> — your source code file</li>
              <li><code className="bg-msx-bgcolor px-1 rounded">mygame.rom</code> — output ROM file (run in OpenMSX)</li>
            </ul>
            <p className="text-msx-textsecondary text-xs mt-2">
              To also generate a symbols file (for debugging):
            </p>
            <pre className="bg-msx-bgcolor text-msx-textprimary text-xs rounded p-2 font-mono mt-1">
{`java -jar glass.jar mygame.asm mygame.rom mygame.sym`}
            </pre>
          </section>

          {/* Section: ZX0 */}
          <section>
            <h3 className="text-msx-accent font-bold mb-1">Bonus — ZX0 Data Compression</h3>
            <p className="text-msx-textprimary leading-relaxed mb-1">
              Mideas can optionally compress game data (tiles, screens, sprites) using the <strong>ZX0</strong> algorithm
              before compiling. This reduces ROM size while keeping your game fully playable.
              The ZX0 compressor tool is included in Mideas — no extra install required.
            </p>
            <p className="text-msx-textsecondary text-xs">
              ZX0 was created by Einar Saukas and is widely used in the MSX and ZX Spectrum communities.
            </p>
          </section>

          {/* Section: Community */}
          <section>
            <h3 className="text-msx-accent font-bold mb-1">Community & Support</h3>
            <div className="space-y-1">
              <a
                href="https://www.msx.org/forum/msx-talk/development/glass-z80-assembler"
                target="_blank"
                rel="noopener noreferrer"
                className="text-msx-highlight underline hover:opacity-80 block text-xs"
              >
                MSX.org Forum — Glass Z80 assembler thread (22 pages of tips &amp; help)
              </a>
              <a
                href="https://www.msx.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-msx-highlight underline hover:opacity-80 block text-xs"
              >
                MSX Resource Center — msx.org
              </a>
            </div>
          </section>

        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-msx-border">
          <Button onClick={onClose} variant="primary" size="md">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

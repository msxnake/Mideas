
import React, { useState, useEffect } from 'react';
import { HelpDocSection, HelpDocArticle } from '../../types';
import { Panel } from '../common/Panel';
import { QuestionMarkCircleIcon, CaretRightIcon, CaretDownIcon } from '../icons/MsxIcons';

interface HelpSidebarProps {
  sections: HelpDocSection[];
  onSelectArticle: (articleId: string, sectionId: string) => void;
  activeArticleId: string | null;
  activeSectionId: string | null;
}

const HelpSidebar: React.FC<HelpSidebarProps> = ({ sections, onSelectArticle, activeArticleId, activeSectionId }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-expand the section of the active article
    if (activeSectionId && !expandedSections.has(activeSectionId)) {
      setExpandedSections(prev => new Set(prev).add(activeSectionId));
    }
  }, [activeSectionId, expandedSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="w-64 bg-msx-panelbg border-r border-msx-border p-2 overflow-y-auto flex-shrink-0">
      <h3 className="text-md font-semibold text-msx-highlight mb-3 pixel-font">Contents</h3>
      {sections.map(section => (
        <div key={section.id} className="mb-2">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full text-left text-sm font-semibold text-msx-textprimary hover:text-msx-accent py-1 px-1.5 rounded flex items-center"
            aria-expanded={expandedSections.has(section.id)}
          >
            {expandedSections.has(section.id) ? <CaretDownIcon className="w-3 h-3 mr-1.5"/> : <CaretRightIcon className="w-3 h-3 mr-1.5"/>}
            {section.title}
          </button>
          {expandedSections.has(section.id) && (
            <ul className="ml-3 mt-1 space-y-0.5 text-xs">
              {section.articles.map(article => (
                <li key={article.id}>
                  <button
                    onClick={() => onSelectArticle(article.id, section.id)}
                    className={`w-full text-left py-1 px-1.5 rounded ${
                      activeArticleId === article.id 
                        ? 'bg-msx-accent text-white font-medium' 
                        : 'text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary'
                    }`}
                  >
                    {article.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

interface ArticleViewerProps {
  article: HelpDocArticle | null;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ article }) => {
  if (!article) {
    return (
      <div className="flex-grow p-6 flex items-center justify-center text-msx-textsecondary">
        <p>Select a topic from the sidebar to view its content.</p>
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-msx-bgcolor">
      <h1 className="text-2xl font-bold text-msx-highlight mb-4 pixel-font">{article.title}</h1>
      <div 
        className="prose prose-sm md:prose-base max-w-none text-msx-textprimary prose-headings:text-msx-cyan prose-strong:text-msx-highlight prose-a:text-msx-accent hover:prose-a:text-msx-highlight prose-ul:list-disc prose-ul:ml-5 prose-ol:list-decimal prose-ol:ml-5 prose-li:my-0.5 prose-code:text-msx-textprimary prose-code:bg-msx-panelbg prose-code:p-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-msx-panelbg prose-pre:p-3 prose-pre:rounded prose-pre:text-xs"
        dangerouslySetInnerHTML={{ __html: article.content }} 
      />
    </div>
  );
};


interface HelpDocsViewerProps {
  helpDocsData: HelpDocSection[];
}

export const HelpDocsViewer: React.FC<HelpDocsViewerProps> = ({ helpDocsData }) => {
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    // Select the first article of the first section by default
    if (helpDocsData.length > 0 && helpDocsData[0].articles.length > 0) {
      setActiveSectionId(helpDocsData[0].id);
      setActiveArticleId(helpDocsData[0].articles[0].id);
    }
  }, [helpDocsData]);

  const handleSelectArticle = (articleId: string, sectionId: string) => {
    setActiveArticleId(articleId);
    setActiveSectionId(sectionId);
  };

  const currentArticle = helpDocsData
    .find(section => section.id === activeSectionId)
    ?.articles.find(article => article.id === activeArticleId) || null;

  return (
    <Panel title="Help & Documentation" icon={<QuestionMarkCircleIcon />} className="flex-grow flex flex-col !p-0">
      <div className="flex flex-grow overflow-hidden">
        <HelpSidebar 
            sections={helpDocsData} 
            onSelectArticle={handleSelectArticle} 
            activeArticleId={activeArticleId}
            activeSectionId={activeSectionId}
        />
        <ArticleViewer article={currentArticle} />
      </div>
    </Panel>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './DynamicTabHeader.css';

const DynamicTabHeader = () => {
    const [tabs, setTabs] = useState([
        { id: 1, title: 'Tab 1', isEditing: false },
        { id: 2, title: 'Tab 2', isEditing: false }
    ]);
    const [activeTab, setActiveTab] = useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [nextId, setNextId] = useState(3);
    const tabsContainerRef = useRef(null);
    const visibleTabsRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const savedTabs = localStorage.getItem('dynamicTabs');
        const savedActiveTab = localStorage.getItem('activeTab');

        if (savedTabs) {
            const parsedTabs = JSON.parse(savedTabs);
            setTabs(parsedTabs);
            setNextId(Math.max(...parsedTabs.map(t => t.id)) + 1);
        }

        if (savedActiveTab) {
            setActiveTab(parseInt(savedActiveTab));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('dynamicTabs', JSON.stringify(tabs));
    }, [tabs]);

    useEffect(() => {
        localStorage.setItem('activeTab', activeTab.toString());
    }, [activeTab]);

    const scrollToActiveTab = useCallback((tabId) => {
        const visibleTabs = tabs.slice(0, 20);
        const tabIndex = visibleTabs.findIndex(tab => tab.id === tabId);

        if (tabIndex !== -1 && visibleTabsRef.current) {
            const tabElement = visibleTabsRef.current.children[tabIndex];
            if (tabElement) {
                const containerWidth = visibleTabsRef.current.offsetWidth;
                const tabLeft = tabElement.offsetLeft;
                const tabWidth = tabElement.offsetWidth;
                const scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);

                visibleTabsRef.current.scrollTo({
                    left: Math.max(0, scrollLeft),
                    behavior: 'smooth'
                });
            }
        }
    }, [tabs]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isDropdownOpen]);

    const addTab = useCallback(() => {
        const newTab = {
            id: nextId,
            title: `Tab ${nextId}`,
            isEditing: false
        };
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTab(nextId);
        setNextId(prev => prev + 1);

        setTimeout(() => scrollToActiveTab(nextId), 100);
    }, [nextId, scrollToActiveTab]);

    const removeTab = useCallback((tabId) => {
        if (tabs.length <= 1) return;

        const updatedTabs = tabs.filter(tab => tab.id !== tabId);
        setTabs(updatedTabs);

        const wasInOverflow = tabs.length > 20 && tabs.findIndex(tab => tab.id === tabId) >= 20;

        if (activeTab === tabId) {
            const newActiveTab = updatedTabs[0]?.id || null;
            setActiveTab(newActiveTab);
            if (newActiveTab) {
                setTimeout(() => scrollToActiveTab(newActiveTab), 100);
            }
        }

        if (wasInOverflow && isDropdownOpen) {
            setIsDropdownOpen(false);
            setTimeout(() => {
                if (updatedTabs.length > 20) {
                    setIsDropdownOpen(true);
                }
            }, 50);
        }

        if (updatedTabs.length <= 20) {
            setIsDropdownOpen(false);
        }
    }, [tabs, activeTab, scrollToActiveTab, isDropdownOpen]);

    const selectTab = useCallback((tabId) => {
        setActiveTab(tabId);
        setIsDropdownOpen(false);
        setTimeout(() => scrollToActiveTab(tabId), 100);
    }, [scrollToActiveTab]);

    const toggleDropdown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownOpen(prev => !prev);
    }, []);

    const startEditing = useCallback((tabId) => {
        setTabs(prevTabs => prevTabs.map(tab =>
            tab.id === tabId
                ? { ...tab, isEditing: true }
                : { ...tab, isEditing: false }
        ));
    }, []);

    const saveTitle = useCallback((tabId, newTitle) => {
        if (newTitle.trim()) {
            setTabs(prevTabs => prevTabs.map(tab =>
                tab.id === tabId
                    ? { ...tab, title: newTitle.trim(), isEditing: false }
                    : tab
            ));
        } else {
            setTabs(prevTabs => prevTabs.map(tab =>
                tab.id === tabId
                    ? { ...tab, isEditing: false }
                    : tab
            ));
        }
    }, []);

    const handleKeyPress = useCallback((e, tabId, newTitle) => {
        if (e.key === 'Enter') {
            saveTitle(tabId, newTitle);
        } else if (e.key === 'Escape') {
            setTabs(prevTabs => prevTabs.map(tab =>
                tab.id === tabId
                    ? { ...tab, isEditing: false }
                    : tab
            ));
        }
    }, [saveTitle]);

    const visibleTabs = React.useMemo(() => tabs.slice(0, 20), [tabs]);
    const overflowTabs = React.useMemo(() => tabs.slice(20), [tabs]);
    const hasOverflow = React.useMemo(() => tabs.length > 20, [tabs.length]);

    return (
        <div className="dynamic-tab-header">
            <div className="tab-header-container">
                <div className="tabs-wrapper" ref={tabsContainerRef}>
                    <div className="visible-tabs" ref={visibleTabsRef}>
                        {visibleTabs.map((tab) => (
                            <div
                                key={tab.id}
                                data-tab-id={tab.id}
                                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => selectTab(tab.id)}
                            >
                                {tab.isEditing ? (
                                    <input
                                        type="text"
                                        defaultValue={tab.title}
                                        className="tab-edit-input"
                                        autoFocus
                                        onBlur={(e) => saveTitle(tab.id, e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, tab.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        className="tab-title"
                                        onDoubleClick={() => startEditing(tab.id)}
                                    >
                                        {tab.title}
                                    </span>
                                )}
                                <button
                                    className="tab-close-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTab(tab.id);
                                    }}
                                    aria-label="Close tab"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {hasOverflow && (
                        <div className="overflow-dropdown" ref={dropdownRef}>
                            <button
                                className="dropdown-toggle"
                                onClick={toggleDropdown}
                                aria-label={`More tabs (${overflowTabs.length})`}
                                aria-expanded={isDropdownOpen}
                                aria-haspopup="true"
                            >
                                ⋯ ({overflowTabs.length})
                            </button>

                            {isDropdownOpen && (
                                <div
                                    className="dropdown-menu"
                                    role="menu"
                                    aria-label="Additional tabs"
                                    key={`dropdown-${tabs.length}-${overflowTabs.map(t => t.id).join('-')}`} 
                                >
                                    <div className="dropdown-content">
                                        {overflowTabs.map((tab) => (
                                            <div
                                                key={`overflow-${tab.id}`} // Enhanced key for better tracking
                                                className={`dropdown-item ${activeTab === tab.id ? 'active' : ''}`}
                                                onClick={() => selectTab(tab.id)}
                                                role="menuitem"
                                                tabIndex={0}
                                            >
                                                <span className="dropdown-tab-title">{tab.title}</span>
                                                <button
                                                    className="dropdown-close-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeTab(tab.id);
                                                    }}
                                                    aria-label={`Close ${tab.title}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    className="add-tab-btn"
                    onClick={addTab}
                    aria-label="Add new tab"
                >
                    +
                </button>
            </div>

            <div className="tab-content">
                <div className="content-panel">
                    <h2>Content for {tabs.find(tab => tab.id === activeTab)?.title}</h2>
                    <p>This is the content area for the active tab. Replace this with your actual content.</p>
                </div>
            </div>
        </div>
    );
};

export default DynamicTabHeader;

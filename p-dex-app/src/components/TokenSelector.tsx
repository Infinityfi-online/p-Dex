'use client';

import React, { useState } from 'react';

interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
}

interface TokenSelectorProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  label: string;
}

export default function TokenSelector({ tokens, onSelect, selectedToken, label }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <label className="block mb-2 text-sm font-medium">{label}</label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-gray-800 px-4 py-2 border border-gray-700"
        >
          {selectedToken ? (
            <span>{selectedToken.symbol} - {selectedToken.name}</span>
          ) : (
            <span>Select token</span>
          )}
          <span>▼</span>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 max-h-60 overflow-auto">
            {tokens.map((token) => (
              <button
                key={token.address}
                className="w-full text-left px-4 py-2 hover:bg-gray-700"
                onClick={() => handleSelect(token)}
              >
                <div>{token.symbol} - {token.name}</div>
                <div className="text-xs text-gray-400">{token.address}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
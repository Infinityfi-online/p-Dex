import React from 'react';
import { Web3Provider } from '../../context/Web3Context';
import Layout from '../../components/Layout';
import SwapContent from './SwapContent';

export default function Swap() {
  return (
    <Web3Provider>
      <Layout>
        <SwapContent />
      </Layout>
    </Web3Provider>
  );
} 
import React from 'react';
import { Web3Provider } from '../../context/Web3Context';
import Layout from '../../components/Layout';
import CreatePoolContent from './CreatePoolContent';

export default function CreatePool() {
  return (
    <Web3Provider>
      <Layout>
        <CreatePoolContent />
      </Layout>
    </Web3Provider>
  );
} 
import {
  FREIGHTER_ID,
  FreighterModule,
  type ISupportedWallet,
  StellarWalletsKit,
  WalletNetwork,
} from '@creit.tech/stellar-wallets-kit'
import { Caption, Card, Layout, Loader, Notification, Profile } from '@stellar/design-system'
import BigNumber from 'bignumber.js'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ERRORS } from '../../helpers/error'
import { stroopToXlm } from '../../helpers/format'
import { TESTNET_DETAILS } from '../../helpers/network'
import {
  BASE_FEE,
  XLM_DECIMALS,
  getEstimatedFee,
  getServer,
  getTokenBalance,
  getTokenDecimals,
  getTokenSymbol,
  getTxBuilder,
  submitTx,
} from '../../helpers/soroban'
import { ConfirmPayment } from './confirm-payment'
import { ConnectWallet } from './connect-wallet'
import { Fee } from './fee'
import { PaymentDest } from './payment-destination'
import { SendAmount } from './send-amount'
import { SubmitPayment } from './submit-payment'
import { TokenInput } from './token-input'
import { TxResult } from './tx-result'

import './index.scss'

type StepCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface SendPaymentProps {
  hasHeader?: boolean
}

export const SendPayment = (props: SendPaymentProps) => {
  // This is only needed when this component is consumed by other components that display a different header
  const hasHeader = props.hasHeader === undefined ? true : props.hasHeader

  // Default to Futurenet network, only supported network for now
  const [selectedNetwork] = useState(TESTNET_DETAILS)

  // Initial state, empty states for token/transaction details
  const [activePubKey, setActivePubKey] = useState(null as string | null)
  const [stepCount, setStepCount] = useState(1 as StepCount)
  const [connectionError, setConnectionError] = useState(null as string | null)

  const [tokenId, setTokenId] = useState('')
  const [tokenDecimals, setTokenDecimals] = useState(XLM_DECIMALS)
  const [paymentDestination, setPaymentDest] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenBalance, setTokenBalance] = useState('')
  const [fee, setFee] = useState(BASE_FEE)
  const [memo, setMemo] = useState('')
  const [txResultXDR, settxResultXDR] = useState('')
  const [signedXdr, setSignedXdr] = useState('')

  // 3 basic loading states for now
  const [isLoadingTokenDetails, setLoadingTokenDetails] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingFee, setIsGettingFee] = useState(false)

  // Setup swc, user will set the desired wallet on connect
  const kit: StellarWalletsKit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: [new FreighterModule()],
  })

  // with a user provided token ID, fetch token details
  async function setToken(id: string) {
    setLoadingTokenDetails(true)
    setTokenId(id)

    // get an instance of a Soroban RPC server for the selected network
    const server = getServer(selectedNetwork)

    try {
      // Right now, Soroban only supports operation per transaction
      // so we need to get a transaction builder for every operation we want to call.
      // In the future, we will be able to use more than 1 operation in a single transaction.

      const txBuilderSymbol = await getTxBuilder(
        activePubKey!,
        BASE_FEE,
        server,
        selectedNetwork.networkPassphrase
      )

      // Get the symbol for the set token ID
      // https://github.com/stellar/soroban-examples/blob/main/token/src/contract.rs#L47
      const symbol = await getTokenSymbol(id, txBuilderSymbol, server)
      setTokenSymbol(symbol)

      const txBuilderBalance = await getTxBuilder(
        activePubKey!,
        BASE_FEE,
        server,
        selectedNetwork.networkPassphrase
      )

      // Get the current token balance for the selected token
      // https://github.com/stellar/soroban-examples/blob/main/token/src/contract.rs#L21
      const balance = await getTokenBalance(activePubKey!, id, txBuilderBalance, server)
      setTokenBalance(balance)

      const txBuilderDecimals = await getTxBuilder(
        activePubKey!,
        BASE_FEE,
        server,
        selectedNetwork.networkPassphrase
      )

      // Get the number of decimals set for the selected token, so that we can properly display
      // a formatted value.
      // https://github.com/stellar/soroban-examples/blob/main/token/src/contract.rs#L43
      const decimals = await getTokenDecimals(id, txBuilderDecimals, server)
      setTokenDecimals(decimals)
      setLoadingTokenDetails(false)

      return true
    } catch (error) {
      console.log(error)
      setConnectionError('Unable to fetch token details.')
      setLoadingTokenDetails(false)

      return false
    }
  }

  const getFee = async () => {
    setIsGettingFee(true)
    const server = getServer(selectedNetwork)

    try {
      const builder = await getTxBuilder(
        activePubKey!,
        fee,
        server,
        selectedNetwork.networkPassphrase
      )

      const estimatedFee = await getEstimatedFee(
        tokenId,
        new BigNumber(sendAmount).toNumber(),
        paymentDestination,
        activePubKey!,
        memo,
        builder,
        server
      )
      setFee(stroopToXlm(estimatedFee).toString())
      setIsGettingFee(false)
    } catch (error) {
      // defaults to hardcoded base fee if this fails
      console.log(error)
      setIsGettingFee(false)
    }
  }

  // This uses the StepCount tro render to currently active step in the payment flow
  function renderStep(step: StepCount) {
    switch (step) {
      case 8: {
        const onClick = () => setStepCount(1)
        return <TxResult onClick={onClick} resultXDR={txResultXDR} />
      }
      case 7: {
        // Uses state saved from previous steps in order to submit a transaction to the network
        const submit = async () => {
          setConnectionError(null)
          setIsSubmitting(true)
          try {
            const server = getServer(selectedNetwork)
            const result = await submitTx(signedXdr, selectedNetwork.networkPassphrase, server)

            settxResultXDR(result)
            setIsSubmitting(false)

            setStepCount((stepCount + 1) as StepCount)
          } catch (error) {
            console.log(error)
            setIsSubmitting(false)
            setConnectionError(ERRORS.UNABLE_TO_SUBMIT_TX)
          }
        }
        return (
          <SubmitPayment
            network={selectedNetwork.network}
            destination={paymentDestination}
            amount={sendAmount}
            tokenSymbol={tokenSymbol}
            fee={fee}
            signedXdr={signedXdr}
            isSubmitting={isSubmitting}
            memo={memo}
            onClick={submit}
          />
        )
      }
      case 6: {
        const setSignedTx = (xdr: string) => {
          setConnectionError(null)
          setSignedXdr(xdr)
          setStepCount((stepCount + 1) as StepCount)
        }
        return (
          <ConfirmPayment
            tokenId={tokenId}
            tokenDecimals={tokenDecimals}
            pubKey={activePubKey!}
            tokenSymbol={tokenSymbol}
            onTxSign={setSignedTx}
            network={selectedNetwork.network}
            destination={paymentDestination}
            amount={sendAmount}
            fee={fee}
            memo={memo}
            networkDetails={selectedNetwork}
            kit={kit}
            setError={setConnectionError}
          />
        )
      }
      case 5: {
        const onClick = () => setStepCount((stepCount + 1) as StepCount)
        return <Fee fee={fee} memo={memo} onClick={onClick} setFee={setFee} setMemo={setMemo} />
      }
      case 4: {
        const onClick = async () => {
          // set estimated fee for next step
          await getFee()
          setStepCount((stepCount + 1) as StepCount)
        }

        if (isGettingFee) {
          return (
            <div className="loading">
              <Loader />
            </div>
          )
        }

        return (
          <SendAmount
            amount={sendAmount}
            decimals={tokenDecimals}
            setAmount={setSendAmount}
            onClick={onClick}
            balance={tokenBalance}
            tokenSymbol={tokenSymbol}
          />
        )
      }
      case 3: {
        if (isLoadingTokenDetails) {
          return (
            <div className="loading">
              <Loader />
            </div>
          )
        }
        const onClick = async (value: string) => {
          const success = await setToken(value)

          if (success) {
            setStepCount((stepCount + 1) as StepCount)
          }
        }
        return <TokenInput onClick={onClick} />
      }
      case 2: {
        const onClick = () => setStepCount((stepCount + 1) as StepCount)
        return (
          <PaymentDest
            onClick={onClick}
            setDestination={setPaymentDest}
            destination={paymentDestination}
          />
        )
      }
      // case 1:
      default: {
        const onClick = async () => {
          setConnectionError(null)

          if (!activePubKey) {
            // See https://github.com/Creit-Tech/Stellar-Wallets-Kit/tree/main for more options
            await kit.openModal({
              onWalletSelected: async (option: ISupportedWallet) => {
                try {
                  // Set selected wallet,  network, and public key
                  kit.setWallet(option.id)
                  const publicKey = await kit.getPublicKey()

                  setActivePubKey(publicKey)
                } catch (error) {
                  console.log(error)
                  setConnectionError(ERRORS.WALLET_CONNECTION_REJECTED)
                }
              },
            })
          } else {
            setStepCount((stepCount + 1) as StepCount)
          }
        }
        return (
          <ConnectWallet
            selectedNetwork={selectedNetwork.network}
            pubKey={activePubKey}
            onClick={onClick}
          />
        )
      }
    }
  }

  return (
    <>
      {hasHeader && <Layout.Header hasThemeSwitch projectId="soroban-react-payment" />}
      <div className="Layout__inset account-badge-row">
        {activePubKey !== null && <Profile isShort publicAddress={activePubKey} size="sm" />}
      </div>
      <div className="Layout__inset layout">
        <div className="payment">
          <Card variant="primary">
            <Caption size="sm" addlClassName="step-count">
              step {stepCount} of 8
            </Caption>
            {renderStep(stepCount)}
          </Card>
        </div>
        <div className="notification-container">
          {connectionError !== null &&
            createPortal(
              <Notification title={connectionError!} variant="error" />,
              document.getElementById('root')!
            )}
        </div>
      </div>
    </>
  )
}

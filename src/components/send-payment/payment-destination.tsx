import { Button, Heading, Input } from '@stellar/design-system'
import type { ChangeEvent } from 'react'

interface PaymentDestProps {
  destination: string
  setDestination: (address: string) => void
  onClick: () => void
}

export const PaymentDest = (props: PaymentDestProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    props.setDestination(event.target.value)
  }

  return (
    <>
      <Heading as="h1" size="sm">
        Choose a Payment Destination
      </Heading>
      <Input
        fieldSize="md"
        id="input-destination"
        label="Destination Account"
        value={props.destination}
        onChange={handleChange}
      />
      <div className="submit-row-destination">
        <Button
          size="md"
          variant="tertiary"
          isFullWidth
          onClick={props.onClick}
          disabled={props.destination.length < 1}
        >
          Next
        </Button>
      </div>
    </>
  )
}

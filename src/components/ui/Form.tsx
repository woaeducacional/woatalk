import * as React from 'react'
import { Controller, FieldPath, FieldValues, FormProvider, UseFormReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface FormProps<TFieldValues extends FieldValues>
  extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode | React.ReactNode[]
  form: UseFormReturn<TFieldValues>
}

const Form = React.forwardRef<HTMLFormElement, FormProps<any>>(
  ({ className, form, children, ...props }, ref) => (
    <FormProvider {...form}>
      <form ref={ref} className={cn('space-y-6', className)} {...props}>
        {children}
      </form>
    </FormProvider>
  )
)

Form.displayName = 'Form'

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> {
  name: TName
  render: (props: { field: any; fieldState: any }) => React.ReactElement
}

const FormField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({
  name,
  render,
}: FormFieldProps<TFieldValues, TName>) => {
  const { control } = React.useContext(FormContext)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => render({ field, fieldState })}
    />
  )
}

const FormContext = React.createContext<any>({})

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-2', className)} {...props} />
))

FormItem.displayName = 'FormItem'

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ocean-100', className)}
    {...props}
  />
))

FormLabel.displayName = 'FormLabel'

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div ref={ref} {...props} />
))

FormControl.displayName = 'FormControl'

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm font-medium text-red-400', className)}
    {...props}
  />
))

FormMessage.displayName = 'FormMessage'

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
}

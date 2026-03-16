import * as React from 'react';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  header?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, header, content, footer, ...props }, ref) => (
    <div
      ref={ref}
      className={`card${className ? ` ${className}` : ''}`}
      {...props}
    >
      {header}
      {content}
      {footer}
    </div>
  )
);
Card.displayName = 'Card';

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`card-header${className ? ` ${className}` : ''}`}
      {...props}
    >
      {title}
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`card-title${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={`card-description${className ? ` ${className}` : ''}`} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`card-content${className ? ` ${className}` : ''}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`card-footer${className ? ` ${className}` : ''}`} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface MenuCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
}

export function MenuCard({ title, description, image, href }: MenuCardProps) {
  return (
    <Link to={href} className="h-full">
      <Card className="overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="h-40 bg-muted">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <CardContent className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 flex-1">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

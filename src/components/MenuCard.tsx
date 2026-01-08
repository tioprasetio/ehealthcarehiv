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
    <Link to={href}>
      <Card className="overflow-hidden hover:shadow-lg transition cursor-pointer">
        {/* Image */}
        <div className="h-40 bg-muted">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

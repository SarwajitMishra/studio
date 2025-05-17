import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Chess Game',
};

const ChessSquare = ({ isLight }: { isLight: boolean }) => {
  return (
    <div className={`aspect-square ${isLight ? 'bg-primary/20' : 'bg-primary/60'} flex items-center justify-center shadow-inner`}>
      {/* Future chess pieces can go here */}
    </div>
  );
};

export default function ChessPage() {
  const boardSize = 8;
  const board = Array(boardSize * boardSize).fill(null);

  return (
    <div className="flex flex-col items-center space-y-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary">Play Chess!</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          <p className="text-lg text-foreground/80 mb-6 text-center">
            Challenge your mind with the classic game of chess.
          </p>
          <div
            className="grid grid-cols-8 w-full max-w-md aspect-square border-4 border-primary rounded-md overflow-hidden shadow-lg"
            aria-label="Chess board"
          >
            {board.map((_, index) => {
              const row = Math.floor(index / boardSize);
              const col = index % boardSize;
              const isLight = (row + col) % 2 === 0;
              return <ChessSquare key={index} isLight={isLight} />;
            })}
          </div>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            (Full game logic and pieces coming soon!)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
